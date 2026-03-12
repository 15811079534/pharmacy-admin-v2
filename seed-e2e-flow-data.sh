#!/usr/bin/env bash

set -euo pipefail

# ===============================
# 全流程压测造数脚本（管理后台 + 小程序下单 + 后台发货）
# ===============================
#
# 默认使用线上环境，可通过环境变量覆盖：
# ADMIN_BASE, APP_BASE, TENANT_ID
# ADMIN_USERNAME, ADMIN_PASSWORD
# APP_MOBILE, APP_PASSWORD
# TOP_CATEGORY_COUNT, SUB_PER_TOP, BRAND_COUNT, LEVEL_COUNT, EXPRESS_COUNT, GOODS_COUNT
#
# 订单链路依赖：
# 1) 已知可登录的会员账号（APP_MOBILE/APP_PASSWORD）
# 2) 可选：通过数据库创建“0 运费”快递模板（需要 SSH + MySQL 权限）
#    SERVER_IP, SERVER_USER, SERVER_PASS, MYSQL_ROOT_PASSWORD, MYSQL_DB
#

ADMIN_BASE="${ADMIN_BASE:-https://azhe.tech/admin-api}"
APP_BASE="${APP_BASE:-https://azhe.tech/app-api}"
TENANT_ID="${TENANT_ID:-1}"

ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

APP_MOBILE="${APP_MOBILE:-13800138003}"
APP_PASSWORD="${APP_PASSWORD:-Test@123456}"

TOP_CATEGORY_COUNT="${TOP_CATEGORY_COUNT:-4}"
SUB_PER_TOP="${SUB_PER_TOP:-3}"
BRAND_COUNT="${BRAND_COUNT:-10}"
LEVEL_COUNT="${LEVEL_COUNT:-4}"
EXPRESS_COUNT="${EXPRESS_COUNT:-6}"
GOODS_COUNT="${GOODS_COUNT:-18}"
STOCK_TEST_GOODS_COUNT="${STOCK_TEST_GOODS_COUNT:-10}"

# 可选：用于自动创建运费模板（保障快递下单可走通）
SERVER_IP="${SERVER_IP:-101.201.42.83}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASS="${SERVER_PASS:-}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
MYSQL_DB="${MYSQL_DB:-pharmacy_pharmacy}"

SEED_TAG="$(date '+%Y%m%d%H%M%S')"
IMAGE_URL="${IMAGE_URL:-https://azhe.tech/vite.svg}"

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少命令: $cmd" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq

if ! command -v sshpass >/dev/null 2>&1; then
  log "提示: 未检测到 sshpass，将跳过自动创建运费模板"
fi

admin_token=""
app_token=""
delivery_template_id=""
mock_channel_id=""
order_id=""
pay_order_id=""
address_id=""
order_after_delivery_status=""
order_flow_status="NOT_RUN"
order_flow_error=""
pay_order_notify_url="${PAY_ORDER_NOTIFY_URL:-http://localhost:48080/app-api/trade/order/update-paid}"

declare -a top_category_ids=()
declare -a leaf_category_ids=()
declare -a brand_ids=()
declare -a level_ids=()
declare -a express_ids=()
declare -a spu_ids=()
declare -a sku_ids=()
declare -a stock_checked_spu_ids=()

admin_call() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local url="${ADMIN_BASE}${path}"
  local resp

  if [[ -n "$data" ]]; then
    resp="$(curl --http1.1 -sS -X "$method" "$url" \
      -H "tenant-id: ${TENANT_ID}" \
      -H "Authorization: Bearer ${admin_token}" \
      -H "Content-Type: application/json" \
      -d "$data")"
  else
    resp="$(curl --http1.1 -sS -X "$method" "$url" \
      -H "tenant-id: ${TENANT_ID}" \
      -H "Authorization: Bearer ${admin_token}")"
  fi

  local code
  code="$(echo "$resp" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    echo "Admin API 调用失败: ${method} ${path}" >&2
    echo "$resp" | jq . >&2 || echo "$resp" >&2
    return 1
  fi
  echo "$resp"
}

app_call() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local url="${APP_BASE}${path}"
  local resp

  if [[ -n "$data" ]]; then
    resp="$(curl --http1.1 -sS -X "$method" "$url" \
      -H "tenant-id: ${TENANT_ID}" \
      -H "Authorization: Bearer ${app_token}" \
      -H "Content-Type: application/json" \
      -d "$data")"
  else
    resp="$(curl --http1.1 -sS -X "$method" "$url" \
      -H "tenant-id: ${TENANT_ID}" \
      -H "Authorization: Bearer ${app_token}")"
  fi

  local code
  code="$(echo "$resp" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    echo "App API 调用失败: ${method} ${path}" >&2
    echo "$resp" | jq . >&2 || echo "$resp" >&2
    return 1
  fi
  echo "$resp"
}

mark_order_flow_failed() {
  local reason="$1"
  order_flow_status="FAILED"
  order_flow_error="$reason"
  log "订单链路失败: ${reason}"
}

login_admin() {
  log "登录管理后台账号..."
  local resp
  resp="$(curl --http1.1 -sS -X POST "${ADMIN_BASE}/system/auth/login" \
    -H "tenant-id: ${TENANT_ID}" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc \
      --arg username "${ADMIN_USERNAME}" \
      --arg password "${ADMIN_PASSWORD}" \
      '{username:$username,password:$password,captchaVerification:"2"}')")"
  local code
  code="$(echo "$resp" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    echo "管理后台登录失败" >&2
    echo "$resp" | jq . >&2 || echo "$resp" >&2
    exit 1
  fi
  admin_token="$(echo "$resp" | jq -r '.data.accessToken')"
}

login_app_member() {
  log "登录小程序会员账号（用于下单链路）..."
  local resp
  resp="$(curl --http1.1 -sS -X POST "${APP_BASE}/member/auth/login" \
    -H "tenant-id: ${TENANT_ID}" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc \
      --arg mobile "${APP_MOBILE}" \
      --arg password "${APP_PASSWORD}" \
      '{mobile:$mobile,password:$password}')")"
  local code
  code="$(echo "$resp" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    log "会员登录失败，订单链路将跳过"
    echo "$resp" | jq . >&2 || true
    return 1
  fi
  app_token="$(echo "$resp" | jq -r '.data.accessToken')"
  return 0
}

ensure_delivery_template() {
  if [[ -n "$delivery_template_id" ]]; then
    return 0
  fi
  if [[ -z "$SERVER_PASS" || -z "$MYSQL_ROOT_PASSWORD" ]]; then
    log "未提供 SERVER_PASS / MYSQL_ROOT_PASSWORD，跳过自动创建运费模板"
    return 1
  fi
  if ! command -v sshpass >/dev/null 2>&1; then
    log "缺少 sshpass，跳过自动创建运费模板"
    return 1
  fi

  log "通过数据库创建 0 运费模板（用于快递下单）..."
  local ssh_opts="-o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no -o NumberOfPasswordPrompts=1"
  local sql
  sql=$(
    cat <<SQL
INSERT INTO trade_delivery_express_template(name, charge_mode, sort, creator, updater, deleted)
VALUES ('FLOW_TEMPLATE_${SEED_TAG}', 1, 1, 'seed', 'seed', b'0');
SELECT LAST_INSERT_ID();
SQL
  )

  delivery_template_id="$(SSHPASS="$SERVER_PASS" sshpass -e ssh $ssh_opts "${SERVER_USER}@${SERVER_IP}" \
    "docker exec -i pharmacy-mysql-shared mysql -uroot -p'${MYSQL_ROOT_PASSWORD}' -D ${MYSQL_DB} -Nse \"$sql\"" | tail -n1 | tr -d '\r')"

  if [[ -z "$delivery_template_id" ]]; then
    log "创建运费模板失败（未拿到模板 ID）"
    return 1
  fi

  local area_sql
  area_sql=$(
    cat <<SQL
INSERT INTO trade_delivery_express_template_charge
  (template_id, area_ids, charge_mode, start_count, start_price, extra_count, extra_price, creator, updater, deleted)
VALUES
  (${delivery_template_id}, '110101,110102,110105,310101,440104', 1, 1, 0, 1, 0, 'seed', 'seed', b'0');
SQL
  )
  SSHPASS="$SERVER_PASS" sshpass -e ssh $ssh_opts "${SERVER_USER}@${SERVER_IP}" \
    "docker exec -i pharmacy-mysql-shared mysql -uroot -p'${MYSQL_ROOT_PASSWORD}' -D ${MYSQL_DB} -Nse \"$area_sql\"" >/dev/null

  log "运费模板创建完成，templateId=${delivery_template_id}"
}

ensure_mock_pay_channel() {
  if [[ -n "$mock_channel_id" ]]; then
    return 0
  fi
  if [[ -z "$SERVER_PASS" || -z "$MYSQL_ROOT_PASSWORD" ]]; then
    log "未提供 SERVER_PASS / MYSQL_ROOT_PASSWORD，跳过自动创建 mock 支付渠道"
    return 1
  fi
  if ! command -v sshpass >/dev/null 2>&1; then
    log "缺少 sshpass，跳过自动创建 mock 支付渠道"
    return 1
  fi

  local ssh_opts="-o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no -o NumberOfPasswordPrompts=1"
  local query_sql
  query_sql=$(
    cat <<SQL
SELECT id
FROM pay_channel
WHERE app_id = 1
  AND code = 'mock'
  AND deleted = b'0'
  AND tenant_id = 1
ORDER BY id DESC
LIMIT 1;
SQL
  )

  mock_channel_id="$(SSHPASS="$SERVER_PASS" sshpass -e ssh $ssh_opts "${SERVER_USER}@${SERVER_IP}" \
    "docker exec -i pharmacy-mysql-shared mysql -uroot -p'${MYSQL_ROOT_PASSWORD}' -D ${MYSQL_DB} -Nse \"$query_sql\"" | tail -n1 | tr -d '\r')"

  if [[ -n "$mock_channel_id" ]]; then
    SSHPASS="$SERVER_PASS" sshpass -e ssh $ssh_opts "${SERVER_USER}@${SERVER_IP}" \
      "docker exec -i pharmacy-mysql-shared mysql -uroot -p'${MYSQL_ROOT_PASSWORD}' -D ${MYSQL_DB} -Nse \"UPDATE pay_channel SET config='{\\\"@class\\\":\\\"cn.pharmacy.pharmacy.module.pay.framework.pay.core.client.impl.NonePayClientConfig\\\"}', status=0, tenant_id=1, deleted=b'0', updater='seed', update_time=NOW() WHERE id=${mock_channel_id};\"" >/dev/null
    log "已检测到 mock 支付渠道，channelId=${mock_channel_id}"
    return 0
  fi

  local insert_sql
  insert_sql=$(
    cat <<SQL
INSERT INTO pay_channel
  (code, status, remark, fee_rate, app_id, config, creator, updater, deleted, tenant_id)
VALUES
  ('mock', 0, 'FLOW_MOCK_CHANNEL_${SEED_TAG}', 0, 1, '{"@class":"cn.pharmacy.pharmacy.module.pay.framework.pay.core.client.impl.NonePayClientConfig"}', 'seed', 'seed', b'0', 1);
SELECT LAST_INSERT_ID();
SQL
  )

  mock_channel_id="$(SSHPASS="$SERVER_PASS" sshpass -e ssh $ssh_opts "${SERVER_USER}@${SERVER_IP}" \
    "docker exec -i pharmacy-mysql-shared mysql -uroot -p'${MYSQL_ROOT_PASSWORD}' -D ${MYSQL_DB} -Nse \"$insert_sql\"" | tail -n1 | tr -d '\r')"
  if [[ -z "$mock_channel_id" ]]; then
    log "创建 mock 支付渠道失败"
    return 1
  fi
  log "mock 支付渠道创建完成，channelId=${mock_channel_id}"
}

ensure_pay_app_notify_url() {
  if [[ -z "$SERVER_PASS" || -z "$MYSQL_ROOT_PASSWORD" ]]; then
    log "未提供 SERVER_PASS / MYSQL_ROOT_PASSWORD，跳过修正 pay_app 通知地址"
    return 1
  fi
  if ! command -v sshpass >/dev/null 2>&1; then
    log "缺少 sshpass，跳过修正 pay_app 通知地址"
    return 1
  fi

  local ssh_opts="-o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no -o NumberOfPasswordPrompts=1"
  local sql
  sql=$(
    cat <<SQL
UPDATE pay_app
SET order_notify_url = '${pay_order_notify_url}', updater = 'seed', update_time = NOW()
WHERE id = 1 AND tenant_id = 1;
SQL
  )

  SSHPASS="$SERVER_PASS" sshpass -e ssh $ssh_opts "${SERVER_USER}@${SERVER_IP}" \
    "docker exec -i pharmacy-mysql-shared mysql -uroot -p'${MYSQL_ROOT_PASSWORD}' -D ${MYSQL_DB} -Nse \"$sql\"" >/dev/null
  log "已修正 pay_app.order_notify_url=${pay_order_notify_url}"
}

create_categories() {
  log "批量创建分类（顶级 + 二级）..."
  local i j parent_id name payload resp id

  for ((i=1; i<=TOP_CATEGORY_COUNT; i++)); do
    name="流程分类${SEED_TAG}-T${i}"
    payload="$(jq -nc \
      --arg name "$name" \
      --arg pic "$IMAGE_URL" \
      --argjson sort "$i" \
      '{parentId:0,name:$name,picUrl:$pic,sort:$sort,status:0,description:"流程压测-顶级分类"}')"
    resp="$(admin_call POST '/product/category/create' "$payload")"
    id="$(echo "$resp" | jq -r '.data')"
    top_category_ids+=("$id")
  done

  local sub_index=1
  for parent_id in "${top_category_ids[@]}"; do
    for ((j=1; j<=SUB_PER_TOP; j++)); do
      name="流程分类${SEED_TAG}-L${sub_index}"
      payload="$(jq -nc \
        --arg name "$name" \
        --arg pic "$IMAGE_URL" \
        --argjson parentId "$parent_id" \
        --argjson sort "$j" \
        '{parentId:$parentId,name:$name,picUrl:$pic,sort:$sort,status:0,description:"流程压测-二级分类"}')"
      resp="$(admin_call POST '/product/category/create' "$payload")"
      id="$(echo "$resp" | jq -r '.data')"
      leaf_category_ids+=("$id")
      sub_index=$((sub_index + 1))
    done
  done
}

create_brands() {
  log "批量创建品牌..."
  local i payload resp id
  for ((i=1; i<=BRAND_COUNT; i++)); do
    payload="$(jq -nc \
      --arg name "流程品牌${SEED_TAG}-${i}" \
      --arg logo "$IMAGE_URL" \
      --arg desc "流程压测品牌-${i}" \
      --argjson sort "$i" \
      '{name:$name,picUrl:$logo,sort:$sort,description:$desc,status:0}')"
    resp="$(admin_call POST '/product/brand/create' "$payload")"
    id="$(echo "$resp" | jq -r '.data')"
    brand_ids+=("$id")
  done
}

create_levels() {
  log "批量创建会员等级..."
  local i payload resp id level_num exp_num
  local level_list max_level max_exp
  level_list="$(admin_call GET '/member/level/list')"
  max_level="$(echo "$level_list" | jq -r '(.data // [] | map(.level // 0) | max // 0)')"
  max_exp="$(echo "$level_list" | jq -r '(.data // [] | map(.experience // 0) | max // 0)')"

  for ((i=1; i<=LEVEL_COUNT; i++)); do
    level_num=$((max_level + i))
    exp_num=$((max_exp + i * 100))
    payload="$(jq -nc \
      --arg name "流程等级${SEED_TAG}-${i}" \
      --argjson exp "$exp_num" \
      --argjson level "$level_num" \
      --argjson discount "$((100 - i))" \
      '{name:$name,experience:$exp,level:$level,discountPercent:$discount,icon:"",backgroundUrl:"",status:0}')"
    resp="$(admin_call POST '/member/level/create' "$payload")"
    id="$(echo "$resp" | jq -r '.data')"
    level_ids+=("$id")
  done
}

create_express() {
  log "批量创建物流公司..."
  local i payload resp id code
  for ((i=1; i<=EXPRESS_COUNT; i++)); do
    code="FLOW${SEED_TAG}${i}"
    payload="$(jq -nc \
      --arg code "$code" \
      --arg name "流程物流${SEED_TAG}-${i}" \
      --arg logo "$IMAGE_URL" \
      --argjson sort "$i" \
      '{code:$code,name:$name,logo:$logo,sort:$sort,status:0}')"
    resp="$(admin_call POST '/trade/delivery/express/create' "$payload")"
    id="$(echo "$resp" | jq -r '.data')"
    express_ids+=("$id")
  done
}

create_goods() {
  log "批量创建药品（含上架）..."
  local i cat_idx brand_idx cat_id brand_id payload resp spu_id detail sku_id price_fen stock delivery_tpl

  delivery_tpl="${delivery_template_id:-0}"

  for ((i=1; i<=GOODS_COUNT; i++)); do
    cat_idx=$(( (i - 1) % ${#leaf_category_ids[@]} ))
    brand_idx=$(( (i - 1) % ${#brand_ids[@]} ))
    cat_id="${leaf_category_ids[$cat_idx]}"
    brand_id="${brand_ids[$brand_idx]}"
    price_fen=$((980 + i * 35))
    stock=$((30 + i * 2))

    payload="$(jq -nc \
      --arg name "流程药品${SEED_TAG}-${i}" \
      --arg pic "$IMAGE_URL" \
      --argjson categoryId "$cat_id" \
      --argjson brandId "$brand_id" \
      --argjson price "$price_fen" \
      --argjson stock "$stock" \
      --argjson deliveryTemplateId "$delivery_tpl" \
      '{
        name:$name,
        keyword:$name,
        introduction:($name + "简介"),
        description:("<p>" + $name + "详情</p>"),
        categoryId:$categoryId,
        brandId:$brandId,
        picUrl:$pic,
        sliderPicUrls:[$pic],
        sort:0,
        specType:false,
        deliveryTypes:[1],
        deliveryTemplateId:$deliveryTemplateId,
        giveIntegral:0,
        subCommissionType:false,
        drugType:0,
        prescriptionRequired:false,
        approvalNumber:null,
        drugInstruction:null,
        virtualSalesCount:0,
        salesCount:0,
        browseCount:0,
        skus:[{
          name:$name,
          price:$price,
          marketPrice:$price,
          costPrice:($price * 7 / 10 | floor),
          barCode:("BAR" + ($categoryId|tostring) + "-" + ($brandId|tostring) + "-" + ($price|tostring)),
          picUrl:$pic,
          stock:$stock,
          weight:0,
          volume:0,
          firstBrokeragePrice:0,
          secondBrokeragePrice:0,
          properties:[]
        }]
      }')"

    resp="$(admin_call POST '/product/spu/create' "$payload")"
    spu_id="$(echo "$resp" | jq -r '.data')"
    spu_ids+=("$spu_id")

    admin_call PUT '/product/spu/update-status' "$(jq -nc --argjson id "$spu_id" '{id:$id,status:1}')" >/dev/null

    detail="$(admin_call GET "/product/spu/get-detail?id=${spu_id}")"
    sku_id="$(echo "$detail" | jq -r '.data.skus[0].id')"
    sku_ids+=("$sku_id")
  done
}

adjust_stock_once() {
  local spu_id="$1"
  local delta="$2"
  local detail payload

  detail="$(admin_call GET "/product/spu/get-detail?id=${spu_id}")"
  payload="$(echo "$detail" | jq --argjson delta "$delta" '
    .data as $d
    | {
        id: $d.id,
        name: $d.name,
        keyword: $d.keyword,
        introduction: $d.introduction,
        description: $d.description,
        categoryId: $d.categoryId,
        brandId: $d.brandId,
        picUrl: $d.picUrl,
        sliderPicUrls: ($d.sliderPicUrls // []),
        sort: ($d.sort // 0),
        specType: ($d.specType // false),
        deliveryTypes: ($d.deliveryTypes // [1]),
        deliveryTemplateId: ($d.deliveryTemplateId // 0),
        giveIntegral: ($d.giveIntegral // 0),
        subCommissionType: ($d.subCommissionType // false),
        drugType: ($d.drugType // 0),
        prescriptionRequired: ($d.prescriptionRequired // false),
        approvalNumber: $d.approvalNumber,
        drugInstruction: $d.drugInstruction,
        virtualSalesCount: ($d.virtualSalesCount // 0),
        salesCount: ($d.salesCount // 0),
        browseCount: ($d.browseCount // 0),
        skus: (
          ($d.skus // [])
          | map({
              name: (.name // $d.name // "默认规格"),
              price: (.price // 0),
              marketPrice: (.marketPrice // 0),
              costPrice: (.costPrice // 0),
              barCode: .barCode,
              picUrl: (.picUrl // $d.picUrl),
              stock: (
                ((.stock // 0) + $delta)
                | if . < 0 then 0 else . end
              ),
              weight: (if .weight == null then 0 else .weight end),
              volume: (if .volume == null then 0 else .volume end),
              firstBrokeragePrice: (.firstBrokeragePrice // 0),
              secondBrokeragePrice: (.secondBrokeragePrice // 0),
              properties: (.properties // [])
            })
        )
      }')"

  admin_call PUT '/product/spu/update' "$payload" >/dev/null
}

create_stock_movements() {
  log "执行库存入库/出库校验（前 ${STOCK_TEST_GOODS_COUNT} 个药品）..."
  local limit i spu_id
  limit="$STOCK_TEST_GOODS_COUNT"
  if (( limit > ${#spu_ids[@]} )); then
    limit="${#spu_ids[@]}"
  fi

  for ((i=0; i<limit; i++)); do
    spu_id="${spu_ids[$i]}"
    adjust_stock_once "$spu_id" 20
    adjust_stock_once "$spu_id" -6
    stock_checked_spu_ids+=("$spu_id")
  done
}

run_order_flow() {
  order_flow_status="RUNNING"
  order_flow_error=""

  if [[ -z "$app_token" ]]; then
    mark_order_flow_failed "member_token_missing"
    return 1
  fi
  if (( ${#sku_ids[@]} == 0 )) || (( ${#spu_ids[@]} == 0 )) || (( ${#express_ids[@]} == 0 )); then
    mark_order_flow_failed "order_prerequisite_data_missing"
    return 1
  fi

  log "创建会员收货地址..."
  local addr_resp
  if ! addr_resp="$(app_call POST '/member/address/create' "$(jq -nc \
    --arg name "流程收货人" \
    --arg mobile "${APP_MOBILE}" \
    '{name:$name,mobile:$mobile,areaId:110101,detailAddress:"流程测试路 88 号",defaultStatus:true}')")"; then
    mark_order_flow_failed "address_create_failed"
    return 1
  fi
  address_id="$(echo "$addr_resp" | jq -r '.data')"

  log "小程序创建订单..."
  local target_sku target_spu create_resp
  target_sku="${sku_ids[0]}"
  target_spu="${spu_ids[0]}"

  # 先做一次商品结算探测，确认小程序侧价格链路正常
  curl --http1.1 -sS -G "${APP_BASE}/trade/order/settlement-product" \
    -H "tenant-id: ${TENANT_ID}" \
    -H "Authorization: Bearer ${app_token}" \
    --data-urlencode "spuIds=${target_spu}" >/dev/null || true

  if ! create_resp="$(app_call POST '/trade/order/create' "$(jq -nc \
    --argjson skuId "$target_sku" \
    --argjson addressId "$address_id" \
    --arg remark "流程压测订单-${SEED_TAG}" \
    '{items:[{skuId:$skuId,count:1}],pointStatus:false,deliveryType:1,addressId:$addressId,remark:$remark}')")"; then
    mark_order_flow_failed "order_create_failed"
    return 1
  fi
  order_id="$(echo "$create_resp" | jq -r '.data.id')"
  pay_order_id="$(echo "$create_resp" | jq -r '.data.payOrderId')"
  if [[ ! "$order_id" =~ ^[0-9]+$ || ! "$pay_order_id" =~ ^[0-9]+$ ]]; then
    mark_order_flow_failed "order_create_response_invalid"
    return 1
  fi

  log "提交支付单（mock 渠道）..."
  if ! app_call POST '/pay/order/submit' "$(jq -nc \
    --arg payOrderId "${pay_order_id}" \
    '{id:($payOrderId|tonumber),channelCode:"mock"}')" >/dev/null; then
    mark_order_flow_failed "pay_order_submit_failed"
    return 1
  fi

  log "完成模拟支付..."
  if ! app_call POST '/pay/order/mock-complete' "$(jq -nc \
    --arg payOrderId "${pay_order_id}" \
    '{id:($payOrderId|tonumber)}')" >/dev/null; then
    mark_order_flow_failed "mock_pay_complete_failed"
    return 1
  fi

  log "触发订单支付完成回调..."
  local paid_payload paid_resp paid_code
  paid_payload="$(jq -nc \
    --arg merchantOrderId "${order_id}" \
    --arg payOrderId "${pay_order_id}" \
    '{merchantOrderId:$merchantOrderId,payOrderId:($payOrderId|tonumber)}')"
  paid_resp="$(curl --http1.1 -sS -X POST "${APP_BASE}/trade/order/update-paid" \
    -H "tenant-id: ${TENANT_ID}" \
    -H "Authorization: Bearer ${app_token}" \
    -H "Content-Type: application/json" \
    -d "${paid_payload}" || true)"
  paid_code="$(echo "$paid_resp" | jq -r '.code // empty' 2>/dev/null)"
  if [[ "$paid_code" == "0" ]]; then
    :
  elif [[ "$paid_code" == "1011000013" ]]; then
    log "订单已由异步通知置为已支付，跳过重复回调"
  else
    echo "App API 调用失败: POST /trade/order/update-paid" >&2
    echo "$paid_resp" | jq . >&2 || echo "$paid_resp" >&2
    mark_order_flow_failed "order_paid_callback_failed"
    return 1
  fi

  log "后台订单发货..."
  if ! admin_call PUT '/trade/order/delivery' "$(jq -nc \
    --arg id "${order_id}" \
    --arg logisticsId "${express_ids[0]}" \
    --arg logisticsNo "FLOWNO-${SEED_TAG}" \
    '{id:($id|tonumber),logisticsId:($logisticsId|tonumber),logisticsNo:$logisticsNo}')" >/dev/null; then
    mark_order_flow_failed "order_delivery_failed"
    return 1
  fi

  local order_detail
  if ! order_detail="$(admin_call GET "/trade/order/get-detail?id=${order_id}")"; then
    mark_order_flow_failed "order_detail_query_failed"
    return 1
  fi
  order_after_delivery_status="$(echo "$order_detail" | jq -r '.data.status')"
  if [[ -z "$order_after_delivery_status" || "$order_after_delivery_status" == "null" ]]; then
    mark_order_flow_failed "order_status_after_delivery_missing"
    return 1
  fi

  order_flow_status="SUCCESS"
  order_flow_error=""
  log "订单链路完成，orderId=${order_id}, status=${order_after_delivery_status}"
}

write_summary() {
  local summary_file="${1:-./seed-e2e-summary-${SEED_TAG}.json}"
  jq -n \
    --arg seedTag "$SEED_TAG" \
    --arg adminBase "$ADMIN_BASE" \
    --arg appBase "$APP_BASE" \
    --arg templateId "${delivery_template_id}" \
    --arg mockChannelId "${mock_channel_id}" \
    --arg orderId "${order_id}" \
    --arg payOrderId "${pay_order_id}" \
    --arg addressId "${address_id}" \
    --arg orderStatus "${order_after_delivery_status}" \
    --arg orderFlowStatus "${order_flow_status}" \
    --arg orderFlowError "${order_flow_error}" \
    --argjson topCategoryCount "${#top_category_ids[@]}" \
    --argjson leafCategoryCount "${#leaf_category_ids[@]}" \
    --argjson brandCount "${#brand_ids[@]}" \
    --argjson levelCount "${#level_ids[@]}" \
    --argjson expressCount "${#express_ids[@]}" \
    --argjson goodsCount "${#spu_ids[@]}" \
    --argjson stockCheckedGoodsCount "${#stock_checked_spu_ids[@]}" \
    --argjson topCategoryIds "$(printf '%s\n' "${top_category_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    --argjson leafCategoryIds "$(printf '%s\n' "${leaf_category_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    --argjson brandIds "$(printf '%s\n' "${brand_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    --argjson levelIds "$(printf '%s\n' "${level_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    --argjson expressIds "$(printf '%s\n' "${express_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    --argjson spuIds "$(printf '%s\n' "${spu_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    --argjson skuIds "$(printf '%s\n' "${sku_ids[@]}" | jq -R . | jq -s 'map(tonumber)')" \
    '{
      seedTag: $seedTag,
      env: {adminBase: $adminBase, appBase: $appBase},
      created: {
        topCategoryCount: $topCategoryCount,
        leafCategoryCount: $leafCategoryCount,
        brandCount: $brandCount,
        levelCount: $levelCount,
        expressCount: $expressCount,
        goodsCount: $goodsCount,
        stockCheckedGoodsCount: $stockCheckedGoodsCount
      },
      ids: {
        deliveryTemplateId: (if $templateId == "" then null else ($templateId | tonumber) end),
        mockPayChannelId: (if $mockChannelId == "" then null else ($mockChannelId | tonumber) end),
        topCategoryIds: $topCategoryIds,
        leafCategoryIds: $leafCategoryIds,
        brandIds: $brandIds,
        levelIds: $levelIds,
        expressIds: $expressIds,
        spuIds: $spuIds,
        skuIds: $skuIds
      },
      orderFlow: {
        status: $orderFlowStatus,
        error: (if $orderFlowError == "" then null else $orderFlowError end),
        addressId: (if $addressId == "" then null else ($addressId | tonumber) end),
        orderId: (if $orderId == "" then null else ($orderId | tonumber) end),
        payOrderId: (if $payOrderId == "" then null else ($payOrderId | tonumber) end),
        orderStatusAfterDelivery: (if $orderStatus == "" then null else ($orderStatus | tonumber) end)
      }
    }' > "$summary_file"
  log "已生成总结: $summary_file"
}

main() {
  login_admin

  # 尽力创建运费模板；失败也继续（仅影响订单链路）
  ensure_delivery_template || true
  # 尽力创建 mock 支付渠道；失败也继续（仅影响订单链路）
  ensure_mock_pay_channel || true
  # 尽力修正支付回调地址；失败也继续（仅影响支付自动回调）
  ensure_pay_app_notify_url || true

  create_categories
  create_brands
  create_levels
  create_express
  create_goods
  create_stock_movements

  if login_app_member; then
    run_order_flow || true
  fi

  write_summary "./seed-e2e-summary-${SEED_TAG}.json"
  log "全流程造数完成"
}

main "$@"
