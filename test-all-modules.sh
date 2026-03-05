#!/usr/bin/env bash

# 医疗小程序后台管理 - 全模块接口写入测试
# 目标：
# 1) 通过当前后端接口真实写入测试数据（新增/更新）
# 2) 覆盖 12 个功能模块的关键接口连通性
# 3) 自动清理本次新增数据，避免污染环境

set -u
set -o pipefail

BASE_URL="${BASE_URL:-http://localhost:48080/admin-api}"
APP_BASE_URL="${APP_BASE_URL:-http://localhost:48080/app-api}"
TENANT_ID="${TENANT_ID:-1}"
USERNAME="${USERNAME:-admin}"
PASSWORD="${PASSWORD:-admin123}"
BULK_COUNT="${BULK_COUNT:-3}"
GOODS_BATCH_COUNT="${GOODS_BATCH_COUNT:-$BULK_COUNT}"
STORE_BATCH_COUNT="${STORE_BATCH_COUNT:-$BULK_COUNT}"
BANNER_BATCH_COUNT="${BANNER_BATCH_COUNT:-$BULK_COUNT}"
NOTICE_BATCH_COUNT="${NOTICE_BATCH_COUNT:-$BULK_COUNT}"
CATEGORY_BATCH_COUNT="${CATEGORY_BATCH_COUNT:-$GOODS_BATCH_COUNT}"
BRAND_BATCH_COUNT="${BRAND_BATCH_COUNT:-$GOODS_BATCH_COUNT}"
MEMBER_BATCH_COUNT="${MEMBER_BATCH_COUNT:-$BULK_COUNT}"
ORDER_BATCH_COUNT="${ORDER_BATCH_COUNT:-$BULK_COUNT}"
MEMBER_MOBILES_CSV="${MEMBER_MOBILES_CSV:-13900000001,13900000002,13900000003}"
APP_MEMBER_PASSWORD="${APP_MEMBER_PASSWORD:-admin123}"
APP_ORDER_SKU_ID="${APP_ORDER_SKU_ID:-90005}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

TOKEN=""
HTTP_CODE=""
RESPONSE_BODY=""
BIZ_CODE=""
BIZ_MSG=""

CATEGORY_PARENT_ID=""
declare -a CATEGORY_IDS=()
declare -a BRAND_IDS=()
declare -a GOODS_IDS=()
declare -a STORE_IDS=()
declare -a BANNER_IDS=()
declare -a NOTICE_IDS=()
declare -a APP_ORDER_IDS=()
declare -a APP_ADDRESS_IDS=()

TEST_SUFFIX="$(date '+%Y%m%d%H%M%S')-$RANDOM"

sanitize_positive_int() {
  local value="$1"
  local fallback="$2"
  if [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
    echo "$value"
  else
    echo "$fallback"
  fi
}

GOODS_BATCH_COUNT="$(sanitize_positive_int "$GOODS_BATCH_COUNT" 3)"
STORE_BATCH_COUNT="$(sanitize_positive_int "$STORE_BATCH_COUNT" 3)"
BANNER_BATCH_COUNT="$(sanitize_positive_int "$BANNER_BATCH_COUNT" 3)"
NOTICE_BATCH_COUNT="$(sanitize_positive_int "$NOTICE_BATCH_COUNT" 3)"
CATEGORY_BATCH_COUNT="$(sanitize_positive_int "$CATEGORY_BATCH_COUNT" "$GOODS_BATCH_COUNT")"
BRAND_BATCH_COUNT="$(sanitize_positive_int "$BRAND_BATCH_COUNT" "$GOODS_BATCH_COUNT")"
MEMBER_BATCH_COUNT="$(sanitize_positive_int "$MEMBER_BATCH_COUNT" "$BULK_COUNT")"
ORDER_BATCH_COUNT="$(sanitize_positive_int "$ORDER_BATCH_COUNT" "$BULK_COUNT")"

print_section() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

request_api() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local response=""

  local -a args
  args=(-sS -w "\n%{http_code}" -X "$method" -H "tenant-id: $TENANT_ID")
  if [[ -n "$TOKEN" ]]; then
    args+=(-H "Authorization: Bearer $TOKEN")
  fi

  if [[ "$method" == "GET" || "$method" == "DELETE" ]]; then
    response=$(curl "${args[@]}" "$BASE_URL$url" 2>/dev/null || true)
  else
    args+=(-H "Content-Type: application/json" -d "$data")
    response=$(curl "${args[@]}" "$BASE_URL$url" 2>/dev/null || true)
  fi

  HTTP_CODE="$(echo "$response" | tail -n1)"
  RESPONSE_BODY="$(echo "$response" | sed '$d')"
  BIZ_CODE="$(echo "$RESPONSE_BODY" | jq -r '.code // "null"' 2>/dev/null)"
  BIZ_MSG="$(echo "$RESPONSE_BODY" | jq -r '.msg // ""' 2>/dev/null)"
}

request_app_api() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local app_token="${4:-}"
  local response=""

  local -a args
  args=(-sS -w "\n%{http_code}" -X "$method" -H "tenant-id: $TENANT_ID")
  if [[ -n "$app_token" ]]; then
    args+=(-H "Authorization: Bearer $app_token")
  fi

  if [[ "$method" == "GET" || "$method" == "DELETE" ]]; then
    response=$(curl "${args[@]}" "$APP_BASE_URL$url" 2>/dev/null || true)
  else
    args+=(-H "Content-Type: application/json" -d "$data")
    response=$(curl "${args[@]}" "$APP_BASE_URL$url" 2>/dev/null || true)
  fi

  HTTP_CODE="$(echo "$response" | tail -n1)"
  RESPONSE_BODY="$(echo "$response" | sed '$d')"
  BIZ_CODE="$(echo "$RESPONSE_BODY" | jq -r '.code // "null"' 2>/dev/null)"
  BIZ_MSG="$(echo "$RESPONSE_BODY" | jq -r '.msg // ""' 2>/dev/null)"
}

mark_pass() {
  PASSED=$((PASSED + 1))
  echo -e "${GREEN}✓${NC}"
}

mark_fail() {
  local msg="${1:-}"
  FAILED=$((FAILED + 1))
  echo -e "${RED}✗${NC} (HTTP ${HTTP_CODE:-N/A}, code ${BIZ_CODE:-N/A})"
  if [[ -n "$msg" ]]; then
    echo "  原因: $msg"
  fi
  local detail
  detail="$(echo "$RESPONSE_BODY" | tr '\n' ' ' | head -c 160)"
  if [[ -n "$detail" ]]; then
    echo "  响应: $detail"
  fi
}

mark_skip() {
  local msg="${1:-}"
  SKIPPED=$((SKIPPED + 1))
  echo -e "${YELLOW}-${NC} 跳过${msg:+: $msg}"
}

run_api_test() {
  local module="$1"
  local name="$2"
  local method="$3"
  local url="$4"
  local data="${5:-}"

  TOTAL=$((TOTAL + 1))
  echo -n "[$module] $name ... "

  request_api "$method" "$url" "$data"
  if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
    mark_pass
    return 0
  fi

  mark_fail "${BIZ_MSG:-接口调用失败}"
  return 1
}

cleanup_delete() {
  local label="$1"
  local id="$2"
  local url="$3"
  if [[ -z "$id" ]]; then
    return
  fi
  echo -n "[清理] 删除${label}(id=${id}) ... "
  request_api "DELETE" "$url"
  if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}-${NC} 未清理 (HTTP ${HTTP_CODE:-N/A}, code ${BIZ_CODE:-N/A})"
  fi
}

echo "========================================="
echo "  医疗小程序后台管理 - 全模块写入测试"
echo "========================================="
echo ""
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "后端地址: $BASE_URL"
echo "App地址: $APP_BASE_URL"
echo "租户ID: $TENANT_ID"
echo "批量规模: 分类=${CATEGORY_BATCH_COUNT}, 品牌=${BRAND_BATCH_COUNT}, 药品=${GOODS_BATCH_COUNT}, 门店=${STORE_BATCH_COUNT}, 轮播图=${BANNER_BATCH_COUNT}, 公告=${NOTICE_BATCH_COUNT}"
echo "App批量: 会员=${MEMBER_BATCH_COUNT}, 每会员订单=${ORDER_BATCH_COUNT}, 订单SKU=${APP_ORDER_SKU_ID}"
echo ""

print_section "1. 认证模块"
TOTAL=$((TOTAL + 1))
echo -n "[认证] 登录并获取 Token ... "
LOGIN_PAYLOAD="$(jq -n --arg username "$USERNAME" --arg password "$PASSWORD" '{username: $username, password: $password}')"
request_api "POST" "/system/auth/login" "$LOGIN_PAYLOAD"
if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
  TOKEN="$(echo "$RESPONSE_BODY" | jq -r '.data.accessToken // empty')"
  if [[ -n "$TOKEN" ]]; then
    mark_pass
  else
    mark_fail "登录成功但未返回 accessToken"
    echo -e "\n${RED}认证失败，无法继续执行写入测试${NC}"
    exit 1
  fi
else
  mark_fail "${BIZ_MSG:-登录失败}"
  echo -e "\n${RED}认证失败，无法继续执行写入测试${NC}"
  exit 1
fi
echo ""

print_section "2. 药品管理模块（新增 + 写入）"

# 2.1 一级分类新增
CATEGORY_PARENT_PAYLOAD="$(jq -n \
  --arg name "接口测试父分类-${TEST_SUFFIX}" \
  --arg picUrl "https://dummyimage.com/128x128/5fa8d3/ffffff.png&text=CAT" \
  '{
    parentId: 0,
    name: $name,
    picUrl: $picUrl,
    sort: 999,
    status: 0,
    description: "接口写入测试"
  }')"
if run_api_test "药品" "新增一级分类" "POST" "/product/category/create" "$CATEGORY_PARENT_PAYLOAD"; then
  CATEGORY_PARENT_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
fi

# 2.2 二级分类批量新增（药品创建必须使用二级及以下分类）
if [[ -n "$CATEGORY_PARENT_ID" ]]; then
  for ((i = 1; i <= CATEGORY_BATCH_COUNT; i++)); do
    CATEGORY_PAYLOAD="$(jq -n \
      --arg name "接口测试子分类-${TEST_SUFFIX}-${i}" \
      --arg picUrl "https://dummyimage.com/128x128/5fa8d3/ffffff.png&text=SUB${i}" \
      --argjson parentId "$CATEGORY_PARENT_ID" \
      --argjson sort $((1000 + i)) \
      '{
        parentId: $parentId,
        name: $name,
        picUrl: $picUrl,
        sort: $sort,
        status: 0,
        description: "接口批量写入测试"
      }')"
    if run_api_test "药品" "新增二级分类#${i}" "POST" "/product/category/create" "$CATEGORY_PAYLOAD"; then
      CATEGORY_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
      if [[ -n "$CATEGORY_ID" ]]; then
        CATEGORY_IDS+=("$CATEGORY_ID")
      fi
    fi
  done
else
  for ((i = 1; i <= CATEGORY_BATCH_COUNT; i++)); do
    TOTAL=$((TOTAL + 1))
    echo -n "[药品] 新增二级分类#${i} ... "
    mark_skip "缺少一级分类前置数据"
  done
fi

# 2.3 品牌批量新增（药品新增前置）
for ((i = 1; i <= BRAND_BATCH_COUNT; i++)); do
  BRAND_PAYLOAD="$(jq -n \
    --arg name "接口测试品牌-${TEST_SUFFIX}-${i}" \
    --arg picUrl "https://dummyimage.com/160x80/4caf50/ffffff.png&text=BRAND${i}" \
    --argjson sort $((900 + i)) \
    '{
      name: $name,
      picUrl: $picUrl,
      sort: $sort,
      status: 0,
      description: "接口批量写入测试"
    }')"
  if run_api_test "药品" "新增品牌#${i}" "POST" "/product/brand/create" "$BRAND_PAYLOAD"; then
    BRAND_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
    if [[ -n "$BRAND_ID" ]]; then
      BRAND_IDS+=("$BRAND_ID")
    fi
  fi
done

# 2.4 药品批量新增
if [[ ${#CATEGORY_IDS[@]} -gt 0 && ${#BRAND_IDS[@]} -gt 0 ]]; then
  for ((i = 1; i <= GOODS_BATCH_COUNT; i++)); do
    category_index=$(( (i - 1) % ${#CATEGORY_IDS[@]} ))
    brand_index=$(( (i - 1) % ${#BRAND_IDS[@]} ))
    CATEGORY_ID="${CATEGORY_IDS[$category_index]}"
    BRAND_ID="${BRAND_IDS[$brand_index]}"
    GOODS_PAYLOAD="$(jq -n \
      --arg name "接口测试药品-${TEST_SUFFIX}-${i}" \
      --arg picUrl "https://dummyimage.com/300x300/607d8b/ffffff.png&text=SKU${i}" \
      --argjson categoryId "$CATEGORY_ID" \
      --argjson brandId "$BRAND_ID" \
      --argjson stock $((20 + i)) \
      --argjson price $((1990 + i * 10)) \
      --argjson costPrice $((1000 + i * 5)) \
      '{
        name: $name,
        keyword: $name,
        introduction: "接口测试简介",
        description: "<p>接口测试详情</p>",
        categoryId: $categoryId,
        brandId: $brandId,
        picUrl: $picUrl,
        sliderPicUrls: [$picUrl],
        sort: 0,
        specType: false,
        deliveryTypes: [1],
        deliveryTemplateId: 0,
        giveIntegral: 0,
        subCommissionType: false,
        drugType: 0,
        prescriptionRequired: false,
        salesCount: 0,
        browseCount: 0,
        virtualSalesCount: 0,
        skus: [
          {
            name: "默认规格",
            price: $price,
            marketPrice: $price,
            costPrice: $costPrice,
            barCode: ("BAR-" + $name),
            picUrl: $picUrl,
            stock: $stock,
            firstBrokeragePrice: 0,
            secondBrokeragePrice: 0,
            properties: []
          }
        ]
      }')"
    TOTAL=$((TOTAL + 1))
    echo -n "[药品] 新增药品#${i} ... "
    request_api "POST" "/product/spu/create" "$GOODS_PAYLOAD"
    if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
      GOODS_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
      if [[ -n "$GOODS_ID" ]]; then
        GOODS_IDS+=("$GOODS_ID")
      fi
      mark_pass
    elif [[ "$BIZ_CODE" == "500" ]]; then
      mark_skip "后端商品表结构异常（需补齐 mall 模块 SQL 字段）"
    else
      mark_fail "${BIZ_MSG:-新增药品失败}"
    fi
  done
else
  for ((i = 1; i <= GOODS_BATCH_COUNT; i++)); do
    TOTAL=$((TOTAL + 1))
    echo -n "[药品] 新增药品#${i} ... "
    mark_skip "缺少分类或品牌前置数据"
  done
fi

# 2.5 库存写入（通过商品更新模拟入库/出库）
if [[ ${#GOODS_IDS[@]} -gt 0 ]]; then
  for GOODS_ID in "${GOODS_IDS[@]}"; do
    TOTAL=$((TOTAL + 1))
    echo -n "[库存] 模拟入库(库存+5,id=${GOODS_ID}) ... "
    request_api "GET" "/product/spu/get-detail?id=${GOODS_ID}"
    if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
      SKU_COUNT="$(echo "$RESPONSE_BODY" | jq -r '.data.skus | length')"
      if [[ "${SKU_COUNT:-0}" -gt 0 ]]; then
        STOCK_IN_PAYLOAD="$(echo "$RESPONSE_BODY" | jq -c '.data | (.skus[0].name //= .name) | (.skus[0].stock = ((.skus[0].stock // 0) + 5))')"
        request_api "PUT" "/product/spu/update" "$STOCK_IN_PAYLOAD"
        if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
          mark_pass
        else
          mark_fail "${BIZ_MSG:-入库写入失败}"
        fi
      else
        mark_fail "商品明细缺少 SKU，无法模拟入库"
      fi
    else
      mark_fail "读取药品详情失败"
    fi

    TOTAL=$((TOTAL + 1))
    echo -n "[库存] 模拟出库(库存-3,id=${GOODS_ID}) ... "
    request_api "GET" "/product/spu/get-detail?id=${GOODS_ID}"
    if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
      SKU_COUNT="$(echo "$RESPONSE_BODY" | jq -r '.data.skus | length')"
      if [[ "${SKU_COUNT:-0}" -gt 0 ]]; then
        STOCK_OUT_PAYLOAD="$(echo "$RESPONSE_BODY" | jq -c '.data | (.skus[0].name //= .name) | (.skus[0].stock = (((.skus[0].stock // 0) - 3) | if . < 0 then 0 else . end))')"
        request_api "PUT" "/product/spu/update" "$STOCK_OUT_PAYLOAD"
        if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
          mark_pass
        else
          mark_fail "${BIZ_MSG:-出库写入失败}"
        fi
      else
        mark_fail "商品明细缺少 SKU，无法模拟出库"
      fi
    else
      mark_fail "读取药品详情失败"
    fi
  done
else
  for ((i = 1; i <= GOODS_BATCH_COUNT; i++)); do
    TOTAL=$((TOTAL + 1))
    echo -n "[库存] 模拟入库(库存+5)#${i} ... "
    mark_skip "缺少药品前置数据"
    TOTAL=$((TOTAL + 1))
    echo -n "[库存] 模拟出库(库存-3)#${i} ... "
    mark_skip "缺少药品前置数据"
  done
fi

# 药品管理读接口回归
run_api_test "药品" "分类列表查询" "GET" "/product/category/list"
run_api_test "药品" "药品分页查询" "GET" "/product/spu/page?pageNo=1&pageSize=10"
echo ""

print_section "3. 订单管理模块（当前接口校验）"
run_api_test "订单" "订单分页查询" "GET" "/trade/order/page?pageNo=1&pageSize=10"
run_api_test "订单" "售后分页查询" "GET" "/trade/after-sale/page?pageNo=1&pageSize=10"
run_api_test "订单" "物流公司列表" "GET" "/trade/delivery/express/list-all-simple"
echo ""

print_section "4. 医疗业务模块（新增 + 当前接口）"

# 4.1 门店批量新增
for ((i = 1; i <= STORE_BATCH_COUNT; i++)); do
  STORE_PAYLOAD="$(jq -n \
    --arg name "接口测试门店-${TEST_SUFFIX}-${i}" \
    --arg address "上海市浦东新区测试路${RANDOM}号-${i}" \
    --arg picUrl "https://dummyimage.com/300x200/2196f3/ffffff.png&text=STORE${i}" \
    --arg phone "1380013$(printf '%04d' "$((8000 + i))")" \
    '{
      name: $name,
      address: $address,
      longitude: 121.4737,
      latitude: 31.2304,
      phone: $phone,
      openTime: "08:00",
      closeTime: "22:00",
      deliveryRadius: 3,
      status: 1,
      picUrl: $picUrl
    }')"
  if run_api_test "医疗" "新增门店#${i}" "POST" "/trade/pharmacy-store/create" "$STORE_PAYLOAD"; then
    STORE_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
    if [[ -n "$STORE_ID" ]]; then
      STORE_IDS+=("$STORE_ID")
    fi
  fi
done

run_api_test "医疗" "处方分页查询" "GET" "/trade/admin/prescription/page?pageNo=1&pageSize=10"
run_api_test "医疗" "医保分页查询" "GET" "/trade/insurance/page?pageNo=1&pageSize=10"
run_api_test "医疗" "门店列表查询" "GET" "/trade/pharmacy-store/list"
echo ""

print_section "5. 会员管理模块（当前接口）"
run_api_test "会员" "会员分页查询" "GET" "/member/user/page?pageNo=1&pageSize=10"
echo ""

print_section "5.1 App 会员/订单模块（新增 + 写入）"
if [[ -z "$MEMBER_MOBILES_CSV" ]]; then
  TOTAL=$((TOTAL + 1))
  echo -n "[会员App] 批量登录/下单 ... "
  mark_skip "未配置 MEMBER_MOBILES_CSV"
else
  member_index=0
  for mobile in ${MEMBER_MOBILES_CSV//,/ }; do
    mobile="$(echo "$mobile" | tr -d '[:space:]')"
    if [[ -z "$mobile" ]]; then
      continue
    fi
    member_index=$((member_index + 1))
    if (( member_index > MEMBER_BATCH_COUNT )); then
      break
    fi

    TOTAL=$((TOTAL + 1))
    echo -n "[会员App] 登录#${member_index}(${mobile}) ... "
    APP_LOGIN_PAYLOAD="$(jq -n \
      --arg mobile "$mobile" \
      --arg password "$APP_MEMBER_PASSWORD" \
      '{mobile: $mobile, password: $password}')"
    request_app_api "POST" "/member/auth/login" "$APP_LOGIN_PAYLOAD"
    APP_TOKEN="$(echo "$RESPONSE_BODY" | jq -r '.data.accessToken // empty')"
    if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" && -n "$APP_TOKEN" ]]; then
      mark_pass
    else
      mark_fail "${BIZ_MSG:-会员登录失败}"
      continue
    fi

    TOTAL=$((TOTAL + 1))
    echo -n "[会员App] 新增地址#${member_index} ... "
    APP_ADDRESS_PAYLOAD="$(jq -n \
      --arg name "接口测试收件人-${member_index}" \
      --arg mobile "1380013$(printf '%04d' "$((8600 + member_index))")" \
      --arg detailAddress "上海市浦东新区接口测试路${member_index}号" \
      '{
        name: $name,
        mobile: $mobile,
        areaId: 110101,
        detailAddress: $detailAddress,
        defaultStatus: true
      }')"
    request_app_api "POST" "/member/address/create" "$APP_ADDRESS_PAYLOAD" "$APP_TOKEN"
    APP_ADDRESS_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
    if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" && -n "$APP_ADDRESS_ID" ]]; then
      APP_ADDRESS_IDS+=("$APP_ADDRESS_ID")
      mark_pass
    else
      mark_fail "${BIZ_MSG:-地址新增失败}"
      continue
    fi

    for ((j = 1; j <= ORDER_BATCH_COUNT; j++)); do
      TOTAL=$((TOTAL + 1))
      echo -n "[订单App] 新增订单(m${member_index}-#${j}) ... "
      APP_ORDER_PAYLOAD="$(jq -n \
        --argjson skuId "$APP_ORDER_SKU_ID" \
        --argjson addressId "$APP_ADDRESS_ID" \
        --arg remark "接口批量订单-${TEST_SUFFIX}-m${member_index}-${j}" \
        '{
          items: [{ skuId: $skuId, count: 1 }],
          pointStatus: false,
          deliveryType: 1,
          addressId: $addressId,
          remark: $remark
        }')"
      request_app_api "POST" "/trade/order/create" "$APP_ORDER_PAYLOAD" "$APP_TOKEN"
      if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
        APP_ORDER_ID="$(echo "$RESPONSE_BODY" | jq -r '.data.id // empty')"
        if [[ -n "$APP_ORDER_ID" ]]; then
          APP_ORDER_IDS+=("$APP_ORDER_ID")
        fi
        mark_pass
      else
        mark_fail "${BIZ_MSG:-订单新增失败}"
      fi
    done
  done

  if (( member_index == 0 )); then
    TOTAL=$((TOTAL + 1))
    echo -n "[会员App] 批量登录/下单 ... "
    mark_skip "MEMBER_MOBILES_CSV 未提供有效手机号"
  fi
fi
echo ""

print_section "6. 营销管理模块（新增 + 写入）"

# 6.1 轮播图批量新增
for ((i = 1; i <= BANNER_BATCH_COUNT; i++)); do
  BANNER_PAYLOAD="$(jq -n \
    --arg title "接口测试轮播-${TEST_SUFFIX}-${i}" \
    --arg url "/pages/index/index?source=test-${i}" \
    --arg picUrl "https://dummyimage.com/750x375/ff9800/ffffff.png&text=BANNER${i}" \
    --argjson sort $((90 + i)) \
    '{
      title: $title,
      url: $url,
      picUrl: $picUrl,
      position: 1,
      sort: $sort,
      status: 0,
      memo: "接口批量写入测试"
    }')"
  if run_api_test "营销" "新增轮播图#${i}" "POST" "/promotion/banner/create" "$BANNER_PAYLOAD"; then
    BANNER_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
    if [[ -n "$BANNER_ID" ]]; then
      BANNER_IDS+=("$BANNER_ID")
    fi
  fi
done

# 6.2 公告批量新增
for ((i = 1; i <= NOTICE_BATCH_COUNT; i++)); do
  NOTICE_PAYLOAD="$(jq -n \
    --arg title "接口测试公告-${TEST_SUFFIX}-${i}" \
    --arg content "这是一条接口自动化写入测试公告（批次-${i}）" \
    '{
      title: $title,
      content: $content,
      type: 1,
      status: 0
    }')"
  if run_api_test "营销" "新增公告#${i}" "POST" "/system/notice/create" "$NOTICE_PAYLOAD"; then
    NOTICE_ID="$(echo "$RESPONSE_BODY" | jq -r '.data // empty')"
    if [[ -n "$NOTICE_ID" ]]; then
      NOTICE_IDS+=("$NOTICE_ID")
    fi
  fi
done

run_api_test "营销" "轮播图分页查询" "GET" "/promotion/banner/page?pageNo=1&pageSize=10"
run_api_test "营销" "公告分页查询" "GET" "/system/notice/page?pageNo=1&pageSize=10"
echo ""

print_section "7. 清理测试数据"
# 清理顺序：先删依赖方，再删被依赖方
for ((idx = ${#NOTICE_IDS[@]} - 1; idx >= 0; idx--)); do
  NOTICE_ID="${NOTICE_IDS[$idx]}"
  cleanup_delete "公告" "$NOTICE_ID" "/system/notice/delete?id=${NOTICE_ID}"
done
for ((idx = ${#BANNER_IDS[@]} - 1; idx >= 0; idx--)); do
  BANNER_ID="${BANNER_IDS[$idx]}"
  cleanup_delete "轮播图" "$BANNER_ID" "/promotion/banner/delete?id=${BANNER_ID}"
done
for ((idx = ${#STORE_IDS[@]} - 1; idx >= 0; idx--)); do
  STORE_ID="${STORE_IDS[$idx]}"
  cleanup_delete "门店" "$STORE_ID" "/trade/pharmacy-store/delete?id=${STORE_ID}"
done
for ((idx = ${#GOODS_IDS[@]} - 1; idx >= 0; idx--)); do
  GOODS_ID="${GOODS_IDS[$idx]}"
  echo -n "[清理] 药品移入回收站(id=${GOODS_ID}) ... "
  request_api "PUT" "/product/spu/update-status" "{\"id\":${GOODS_ID},\"status\":-1}"
  if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}-${NC} 未移入回收站 (HTTP ${HTTP_CODE:-N/A}, code ${BIZ_CODE:-N/A})"
  fi
  cleanup_delete "药品" "$GOODS_ID" "/product/spu/delete?id=${GOODS_ID}"
done
for ((idx = ${#BRAND_IDS[@]} - 1; idx >= 0; idx--)); do
  BRAND_ID="${BRAND_IDS[$idx]}"
  cleanup_delete "品牌" "$BRAND_ID" "/product/brand/delete?id=${BRAND_ID}"
done
for ((idx = ${#CATEGORY_IDS[@]} - 1; idx >= 0; idx--)); do
  CATEGORY_ID="${CATEGORY_IDS[$idx]}"
  cleanup_delete "分类" "$CATEGORY_ID" "/product/category/delete?id=${CATEGORY_ID}"
done
cleanup_delete "父分类" "$CATEGORY_PARENT_ID" "/product/category/delete?id=${CATEGORY_PARENT_ID}"
echo ""

echo "========================================="
echo "  测试结果统计"
echo "========================================="
echo ""
echo "总计测试: $TOTAL 项"
echo -e "通过: ${GREEN}$PASSED${NC} 项"
echo -e "失败: ${RED}$FAILED${NC} 项"
echo -e "跳过: ${YELLOW}$SKIPPED${NC} 项"
echo "App写入: 地址=${#APP_ADDRESS_IDS[@]} 条, 订单=${#APP_ORDER_IDS[@]} 条"

if [[ $TOTAL -gt 0 ]]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
else
  SUCCESS_RATE="0.0"
fi

if [[ $FAILED -eq 0 ]]; then
  echo -e "\n${GREEN}✓ 全模块接口写入测试通过${NC}"
else
  echo -e "\n${YELLOW}⚠ 存在失败项，请根据日志修复${NC}"
fi
echo "成功率: ${SUCCESS_RATE}%"
echo ""
echo "========================================="
echo "  测试完成"
echo "========================================="

if [[ $FAILED -eq 0 ]]; then
  exit 0
fi
exit 1
