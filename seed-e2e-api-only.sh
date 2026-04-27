#!/usr/bin/env bash

set -euo pipefail

# 纯接口最小造数脚本：
# - 只通过管理后台 / 小程序接口写入测试数据
# - 不依赖 SSH / MySQL
# - 默认每类只造 1 条，适合生产最小链路验证

ADMIN_BASE="${ADMIN_BASE:-https://azhe.tech/admin-api}"
APP_BASE="${APP_BASE:-https://azhe.tech/app-api}"
TENANT_ID="${TENANT_ID:-1}"

ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
APP_MOBILE="${APP_MOBILE:-13800138003}"
APP_PASSWORD="${APP_PASSWORD:-Test@123456}"

PAY_CHANNEL_CODE="${PAY_CHANNEL_CODE:-mock}"
IMAGE_URL="${IMAGE_URL:-https://azhe.tech/vite.svg}"
REQUEST_GAP_SECONDS="${REQUEST_GAP_SECONDS:-0.2}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-5}"
CURL_MAX_TIME="${CURL_MAX_TIME:-20}"
TEMPLATE_SCAN_LIMIT="${TEMPLATE_SCAN_LIMIT:-10}"
ALLOW_ZERO_DELIVERY_TEMPLATE="${ALLOW_ZERO_DELIVERY_TEMPLATE:-0}"

CREATE_MEMBER_LEVEL="${CREATE_MEMBER_LEVEL:-0}"
ENABLE_AFTERSALE_FLOW="${ENABLE_AFTERSALE_FLOW:-1}"

SEED_TAG="${SEED_TAG:-$(date '+%Y%m%d%H%M%S')}"
SUMMARY_FILE="${SUMMARY_FILE:-./seed-e2e-api-only-summary-${SEED_TAG}.json}"

admin_token=""
app_token=""

parent_category_id=""
leaf_category_id=""
brand_id=""
member_level_id=""
express_id=""
delivery_template_id="${DELIVERY_TEMPLATE_ID:-}"
template_source_spu_id=""
spu_id=""
sku_id=""
address_id=""
order_id=""
order_no=""
pay_order_id=""
order_item_id=""
order_item_pay_price=""
order_status_after_delivery=""
order_status_after_receive=""
after_sale_id=""
after_sale_status=""

overall_status="RUNNING"
overall_error=""

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
  overall_status="FAILED"
  overall_error="$1"
  echo "失败: $1" >&2
  exit 1
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

maybe_sleep() {
  sleep "$REQUEST_GAP_SECONDS"
}

request_json() {
  local base="$1"
  local token="$2"
  local method="$3"
  local path="$4"
  local data="${5:-}"
  local response=""
  local -a args

  args=(
    --http1.1
    -sS
    --connect-timeout "$CURL_CONNECT_TIMEOUT"
    --max-time "$CURL_MAX_TIME"
    -X "$method"
    -H "tenant-id: ${TENANT_ID}"
  )

  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer ${token}")
  fi

  if [[ -n "$data" ]]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi

  response="$(curl "${args[@]}" "${base}${path}")"
  maybe_sleep
  echo "$response"
}

api_call() {
  local scope="$1"
  local base="$2"
  local token="$3"
  local method="$4"
  local path="$5"
  local data="${6:-}"
  local response code

  response="$(request_json "$base" "$token" "$method" "$path" "$data")"
  code="$(echo "$response" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    echo "${scope} API 调用失败: ${method} ${path}" >&2
    echo "$response" | jq . >&2 || echo "$response" >&2
    return 1
  fi
  echo "$response"
}

api_try_call() {
  local scope="$1"
  local base="$2"
  local token="$3"
  local method="$4"
  local path="$5"
  local data="${6:-}"
  local response code msg

  response="$(request_json "$base" "$token" "$method" "$path" "$data")" || return 1
  code="$(echo "$response" | jq -r '.code // empty' 2>/dev/null)"
  if [[ "$code" == "0" ]]; then
    echo "$response"
    return 0
  fi
  msg="$(echo "$response" | jq -r '.msg // ""' 2>/dev/null || true)"
  log "${scope} API 非 0 返回，跳过: ${method} ${path} code=${code:-N/A} msg=${msg}"
  return 1
}

admin_call() {
  api_call "Admin" "$ADMIN_BASE" "$admin_token" "$1" "$2" "${3:-}"
}

admin_try_call() {
  api_try_call "Admin" "$ADMIN_BASE" "$admin_token" "$1" "$2" "${3:-}"
}

app_call() {
  api_call "App" "$APP_BASE" "$app_token" "$1" "$2" "${3:-}"
}

login_admin() {
  log "登录管理后台..."
  local resp
  resp="$(request_json "$ADMIN_BASE" "" "POST" "/system/auth/login" "$(jq -nc \
    --arg username "$ADMIN_USERNAME" \
    --arg password "$ADMIN_PASSWORD" \
    '{username:$username,password:$password,captchaVerification:"2"}')")"
  local code
  code="$(echo "$resp" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    echo "$resp" | jq . >&2 || echo "$resp" >&2
    fail "admin_login_failed"
  fi
  admin_token="$(echo "$resp" | jq -r '.data.accessToken // empty')"
  [[ -n "$admin_token" ]] || fail "admin_token_missing"
}

login_app_member() {
  log "登录小程序会员..."
  local resp
  resp="$(request_json "$APP_BASE" "" "POST" "/member/auth/login" "$(jq -nc \
    --arg mobile "$APP_MOBILE" \
    --arg password "$APP_PASSWORD" \
    '{mobile:$mobile,password:$password}')")"
  local code
  code="$(echo "$resp" | jq -r '.code // empty')"
  if [[ "$code" != "0" ]]; then
    echo "$resp" | jq . >&2 || echo "$resp" >&2
    fail "app_login_failed"
  fi
  app_token="$(echo "$resp" | jq -r '.data.accessToken // empty')"
  [[ -n "$app_token" ]] || fail "app_token_missing"
}

resolve_delivery_template_id() {
  if [[ -n "$delivery_template_id" ]]; then
    log "使用显式提供的运费模板: ${delivery_template_id}"
    return 0
  fi

  log "通过已有商品解析可复用的运费模板..."
  local simple_resp detail_resp candidate_spu candidate_template
  simple_resp="$(admin_call GET '/product/spu/list-all-simple')"

  while IFS= read -r candidate_spu; do
    [[ -n "$candidate_spu" ]] || continue
    detail_resp="$(admin_call GET "/product/spu/get-detail?id=${candidate_spu}")"
    candidate_template="$(echo "$detail_resp" | jq -r '.data.deliveryTemplateId // empty')"
    if [[ "$candidate_template" =~ ^[0-9]+$ && "$candidate_template" -gt 0 ]]; then
      delivery_template_id="$candidate_template"
      template_source_spu_id="$candidate_spu"
      log "已复用运费模板 ${delivery_template_id}（来源商品 ${template_source_spu_id}）"
      return 0
    fi
  done < <(echo "$simple_resp" | jq -r --argjson limit "$TEMPLATE_SCAN_LIMIT" '.data[:$limit][]?.id // empty')

  if [[ "$ALLOW_ZERO_DELIVERY_TEMPLATE" == "1" ]]; then
    delivery_template_id="0"
    log "未找到可复用运费模板，降级使用 deliveryTemplateId=0"
    return 0
  fi

  fail "delivery_template_not_found_via_api"
}

create_categories() {
  log "创建一级分类..."
  local resp
  resp="$(admin_call POST '/product/category/create' "$(jq -nc \
    --arg name "API流程分类${SEED_TAG}-T1" \
    --arg pic "$IMAGE_URL" \
    '{parentId:0,name:$name,picUrl:$pic,sort:1,status:0,description:"纯接口造数-一级分类"}')")"
  parent_category_id="$(echo "$resp" | jq -r '.data')"
  [[ "$parent_category_id" =~ ^[0-9]+$ ]] || fail "parent_category_create_failed"

  log "创建二级分类..."
  resp="$(admin_call POST '/product/category/create' "$(jq -nc \
    --arg name "API流程分类${SEED_TAG}-L1" \
    --arg pic "$IMAGE_URL" \
    --argjson parentId "$parent_category_id" \
    '{parentId:$parentId,name:$name,picUrl:$pic,sort:1,status:0,description:"纯接口造数-二级分类"}')")"
  leaf_category_id="$(echo "$resp" | jq -r '.data')"
  [[ "$leaf_category_id" =~ ^[0-9]+$ ]] || fail "leaf_category_create_failed"
}

create_brand() {
  log "创建品牌..."
  local resp
  resp="$(admin_call POST '/product/brand/create' "$(jq -nc \
    --arg name "API流程品牌${SEED_TAG}-1" \
    --arg pic "$IMAGE_URL" \
    '{name:$name,picUrl:$pic,sort:1,description:"纯接口造数-品牌",status:0}')")"
  brand_id="$(echo "$resp" | jq -r '.data')"
  [[ "$brand_id" =~ ^[0-9]+$ ]] || fail "brand_create_failed"
}

create_member_level_if_needed() {
  if [[ "$CREATE_MEMBER_LEVEL" != "1" ]]; then
    return 0
  fi

  log "创建会员等级..."
  local level_list max_level max_exp resp
  level_list="$(admin_call GET '/member/level/list')"
  max_level="$(echo "$level_list" | jq -r '(.data // [] | map(.level // 0) | max // 0)')"
  max_exp="$(echo "$level_list" | jq -r '(.data // [] | map(.experience // 0) | max // 0)')"

  resp="$(admin_call POST '/member/level/create' "$(jq -nc \
    --arg name "API流程等级${SEED_TAG}-1" \
    --argjson level "$((max_level + 1))" \
    --argjson exp "$((max_exp + 100))" \
    '{name:$name,experience:$exp,level:$level,discountPercent:99,icon:"",backgroundUrl:"",status:0}')")"
  member_level_id="$(echo "$resp" | jq -r '.data')"
  [[ "$member_level_id" =~ ^[0-9]+$ ]] || fail "member_level_create_failed"
}

create_express() {
  log "创建物流公司..."
  local resp
  resp="$(admin_call POST '/trade/delivery/express/create' "$(jq -nc \
    --arg code "API${SEED_TAG}1" \
    --arg name "API流程物流${SEED_TAG}-1" \
    --arg pic "$IMAGE_URL" \
    '{code:$code,name:$name,logo:$pic,sort:1,status:0}')")"
  express_id="$(echo "$resp" | jq -r '.data')"
  [[ "$express_id" =~ ^[0-9]+$ ]] || fail "express_create_failed"
}

create_goods() {
  log "创建药品并上架..."
  local price_fen stock resp detail

  price_fen=1099
  stock=20
  resp="$(admin_call POST '/product/spu/create' "$(jq -nc \
    --arg name "API流程药品${SEED_TAG}-1" \
    --arg pic "$IMAGE_URL" \
    --argjson categoryId "$leaf_category_id" \
    --argjson brandId "$brand_id" \
    --argjson templateId "$delivery_template_id" \
    --argjson price "$price_fen" \
    --argjson stock "$stock" \
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
      deliveryTemplateId:$templateId,
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
        barCode:("API-BAR-" + ($templateId|tostring) + "-" + ($price|tostring)),
        picUrl:$pic,
        stock:$stock,
        weight:0,
        volume:0,
        firstBrokeragePrice:0,
        secondBrokeragePrice:0,
        properties:[]
      }]
    }')")"
  spu_id="$(echo "$resp" | jq -r '.data')"
  [[ "$spu_id" =~ ^[0-9]+$ ]] || fail "spu_create_failed"

  admin_call PUT '/product/spu/update-status' "$(jq -nc --argjson id "$spu_id" '{id:$id,status:1}')" >/dev/null
  detail="$(admin_call GET "/product/spu/get-detail?id=${spu_id}")"
  sku_id="$(echo "$detail" | jq -r '.data.skus[0].id // empty')"
  [[ "$sku_id" =~ ^[0-9]+$ ]] || fail "sku_not_found_after_spu_create"
}

create_address() {
  log "创建会员地址..."
  local resp
  resp="$(app_call POST '/member/address/create' "$(jq -nc \
    --arg name "API流程收货人" \
    --arg mobile "$APP_MOBILE" \
    '{name:$name,mobile:$mobile,areaId:110101,detailAddress:"API流程测试路 66 号",defaultStatus:true}')")"
  address_id="$(echo "$resp" | jq -r '.data')"
  [[ "$address_id" =~ ^[0-9]+$ ]] || fail "address_create_failed"
}

settle_order() {
  log "请求订单结算..."
  app_call GET "/trade/order/settlement?pointStatus=false&type=0&deliveryType=1&addressId=${address_id}&items%5B0%5D.skuId=${sku_id}&items%5B0%5D.count=1" >/dev/null
}

create_order() {
  log "创建订单..."
  local resp
  resp="$(app_call POST '/trade/order/create' "$(jq -nc \
    --argjson skuId "$sku_id" \
    --argjson addressId "$address_id" \
    --arg remark "API纯接口订单-${SEED_TAG}" \
    '{items:[{skuId:$skuId,count:1}],pointStatus:false,deliveryType:1,addressId:$addressId,remark:$remark}')")"

  order_id="$(echo "$resp" | jq -r '.data.id // empty')"
  order_no="$(echo "$resp" | jq -r '.data.no // empty')"
  pay_order_id="$(echo "$resp" | jq -r '.data.payOrderId // empty')"

  [[ "$order_id" =~ ^[0-9]+$ ]] || fail "order_create_failed"
  [[ "$pay_order_id" =~ ^[0-9]+$ ]] || fail "pay_order_id_missing"
}

submit_and_complete_payment() {
  log "提交支付单..."
  app_call POST '/pay/order/submit' "$(jq -nc \
    --argjson id "$pay_order_id" \
    --arg channelCode "$PAY_CHANNEL_CODE" \
    '{id:$id,channelCode:$channelCode}')" >/dev/null

  if [[ "$PAY_CHANNEL_CODE" == "mock" ]]; then
    log "完成 mock 支付..."
    app_call POST '/pay/order/mock-complete' "$(jq -nc --argjson id "$pay_order_id" '{id:$id}')" >/dev/null
  fi

  log "更新业务订单已支付状态..."
  local paid_resp paid_code
  paid_resp="$(request_json "$APP_BASE" "$app_token" "POST" "/trade/order/update-paid" "$(jq -nc \
    --arg merchantOrderId "$order_id" \
    --argjson payOrderId "$pay_order_id" \
    '{merchantOrderId:$merchantOrderId,payOrderId:$payOrderId}')")"
  paid_code="$(echo "$paid_resp" | jq -r '.code // empty')"
  if [[ "$paid_code" != "0" && "$paid_code" != "1011000013" ]]; then
    echo "$paid_resp" | jq . >&2 || echo "$paid_resp" >&2
    fail "order_update_paid_failed"
  fi
}

delivery_order() {
  log "后台发货..."
  admin_call PUT '/trade/order/delivery' "$(jq -nc \
    --argjson id "$order_id" \
    --argjson logisticsId "$express_id" \
    --arg logisticsNo "APIFLOW-${SEED_TAG}" \
    '{id:$id,logisticsId:$logisticsId,logisticsNo:$logisticsNo}')" >/dev/null

  local detail_resp
  detail_resp="$(app_call GET "/trade/order/get-detail?id=${order_id}")"
  order_item_id="$(echo "$detail_resp" | jq -r '.data.items[0].id // empty')"
  order_item_pay_price="$(echo "$detail_resp" | jq -r '.data.items[0].payPrice // empty')"
  order_status_after_delivery="$(echo "$detail_resp" | jq -r '.data.status // empty')"
}

receive_order() {
  log "会员确认收货..."
  app_call PUT "/trade/order/receive?id=${order_id}" >/dev/null
  local detail_resp
  detail_resp="$(app_call GET "/trade/order/get-detail?id=${order_id}")"
  order_status_after_receive="$(echo "$detail_resp" | jq -r '.data.status // empty')"
}

run_aftersale_flow() {
  if [[ "$ENABLE_AFTERSALE_FLOW" != "1" ]]; then
    return 0
  fi
  [[ "$order_item_id" =~ ^[0-9]+$ ]] || fail "order_item_id_missing_for_aftersale"
  [[ "$order_item_pay_price" =~ ^[0-9]+$ ]] || fail "order_item_pay_price_missing_for_aftersale"

  log "申请售后..."
  local create_resp
  create_resp="$(app_call POST '/trade/after-sale/create' "$(jq -nc \
    --argjson orderItemId "$order_item_id" \
    --argjson refundPrice "$order_item_pay_price" \
    '{orderItemId:$orderItemId,way:20,refundPrice:$refundPrice,applyReason:"API接口测试退货退款",applyDescription:"纯接口链路中文校验",applyPicUrls:["https://azhe.tech/vite.svg"]}')")"
  after_sale_id="$(echo "$create_resp" | jq -r '.data // empty')"
  [[ "$after_sale_id" =~ ^[0-9]+$ ]] || fail "after_sale_create_failed"

  log "后台同意售后..."
  admin_call PUT "/trade/after-sale/agree?id=${after_sale_id}" >/dev/null

  log "会员填写退货物流..."
  app_call PUT '/trade/after-sale/delivery' "$(jq -nc \
    --argjson id "$after_sale_id" \
    --argjson logisticsId "$express_id" \
    --arg logisticsNo "APIAFTER-${SEED_TAG}" \
    '{id:$id,logisticsId:$logisticsId,logisticsNo:$logisticsNo}')" >/dev/null

  local detail_resp
  detail_resp="$(app_call GET "/trade/after-sale/get?id=${after_sale_id}")"
  after_sale_status="$(echo "$detail_resp" | jq -r '.data.status // empty')"
}

write_summary() {
  jq -n \
    --arg seedTag "$SEED_TAG" \
    --arg status "$overall_status" \
    --arg error "$overall_error" \
    --arg adminBase "$ADMIN_BASE" \
    --arg appBase "$APP_BASE" \
    --arg parentCategoryId "$parent_category_id" \
    --arg leafCategoryId "$leaf_category_id" \
    --arg brandId "$brand_id" \
    --arg memberLevelId "$member_level_id" \
    --arg expressId "$express_id" \
    --arg deliveryTemplateId "$delivery_template_id" \
    --arg templateSourceSpuId "$template_source_spu_id" \
    --arg spuId "$spu_id" \
    --arg skuId "$sku_id" \
    --arg addressId "$address_id" \
    --arg orderId "$order_id" \
    --arg orderNo "$order_no" \
    --arg payOrderId "$pay_order_id" \
    --arg orderItemId "$order_item_id" \
    --arg orderItemPayPrice "$order_item_pay_price" \
    --arg orderStatusAfterDelivery "$order_status_after_delivery" \
    --arg orderStatusAfterReceive "$order_status_after_receive" \
    --arg afterSaleId "$after_sale_id" \
    --arg afterSaleStatus "$after_sale_status" \
    '{
      seedTag: $seedTag,
      status: $status,
      error: (if $error == "" then null else $error end),
      env: {
        adminBase: $adminBase,
        appBase: $appBase
      },
      ids: {
        parentCategoryId: (if $parentCategoryId == "" then null else ($parentCategoryId | tonumber) end),
        leafCategoryId: (if $leafCategoryId == "" then null else ($leafCategoryId | tonumber) end),
        brandId: (if $brandId == "" then null else ($brandId | tonumber) end),
        memberLevelId: (if $memberLevelId == "" then null else ($memberLevelId | tonumber) end),
        expressId: (if $expressId == "" then null else ($expressId | tonumber) end),
        deliveryTemplateId: (if $deliveryTemplateId == "" then null else ($deliveryTemplateId | tonumber) end),
        templateSourceSpuId: (if $templateSourceSpuId == "" then null else ($templateSourceSpuId | tonumber) end),
        spuId: (if $spuId == "" then null else ($spuId | tonumber) end),
        skuId: (if $skuId == "" then null else ($skuId | tonumber) end),
        addressId: (if $addressId == "" then null else ($addressId | tonumber) end),
        orderId: (if $orderId == "" then null else ($orderId | tonumber) end),
        orderNo: (if $orderNo == "" then null else $orderNo end),
        payOrderId: (if $payOrderId == "" then null else ($payOrderId | tonumber) end),
        orderItemId: (if $orderItemId == "" then null else ($orderItemId | tonumber) end),
        orderItemPayPrice: (if $orderItemPayPrice == "" then null else ($orderItemPayPrice | tonumber) end),
        afterSaleId: (if $afterSaleId == "" then null else ($afterSaleId | tonumber) end)
      },
      states: {
        orderStatusAfterDelivery: (if $orderStatusAfterDelivery == "" then null else ($orderStatusAfterDelivery | tonumber) end),
        orderStatusAfterReceive: (if $orderStatusAfterReceive == "" then null else ($orderStatusAfterReceive | tonumber) end),
        afterSaleStatus: (if $afterSaleStatus == "" then null else ($afterSaleStatus | tonumber) end)
      }
    }' > "$SUMMARY_FILE"
  log "已生成总结: $SUMMARY_FILE"
}

main() {
  login_admin
  login_app_member

  resolve_delivery_template_id
  create_categories
  create_brand
  create_member_level_if_needed
  create_express
  create_goods

  create_address
  settle_order
  create_order
  submit_and_complete_payment
  delivery_order
  receive_order
  run_aftersale_flow

  overall_status="SUCCESS"
}

trap write_summary EXIT

main "$@"
