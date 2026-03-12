#!/usr/bin/env bash

# 轻量联调检查：验证“添加药品/发货/会员等级”关键依赖链路是否可用
# - 仅做读请求，不写入数据
# - 适用于本地后端或已部署环境

set -u
set -o pipefail

BASE_URL="${BASE_URL:-https://azhe.tech/admin-api}"
TENANT_ID="${TENANT_ID:-1}"
USERNAME="${USERNAME:-admin}"
PASSWORD="${PASSWORD:-admin123}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL=0
PASSED=0
FAILED=0
WARNED=0

TOKEN=""
HTTP_CODE=""
RESPONSE_BODY=""
BIZ_CODE=""
BIZ_MSG=""

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

  if [[ "$method" == "POST" || "$method" == "PUT" ]]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi

  response=$(curl "${args[@]}" "$BASE_URL$url" 2>/dev/null || true)
  HTTP_CODE="$(echo "$response" | tail -n1)"
  RESPONSE_BODY="$(echo "$response" | sed '$d')"
  BIZ_CODE="$(echo "$RESPONSE_BODY" | jq -r '.code // "null"' 2>/dev/null)"
  BIZ_MSG="$(echo "$RESPONSE_BODY" | jq -r '.msg // ""' 2>/dev/null)"
}

pass() {
  PASSED=$((PASSED + 1))
  echo -e "${GREEN}PASS${NC}"
}

fail() {
  FAILED=$((FAILED + 1))
  echo -e "${RED}FAIL${NC} (HTTP ${HTTP_CODE:-N/A}, code ${BIZ_CODE:-N/A}) ${BIZ_MSG}"
}

warn() {
  WARNED=$((WARNED + 1))
  echo -e "${YELLOW}WARN${NC} $1"
}

run_check() {
  local name="$1"
  local method="$2"
  local url="$3"
  local mode="${4:-strict}" # strict | optional

  TOTAL=$((TOTAL + 1))
  echo -n "[$TOTAL] $name ... "
  request_api "$method" "$url"

  if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
    pass
    return
  fi

  if [[ "$mode" == "optional" ]]; then
    warn "接口不可用：$url"
    return
  fi
  fail
}

echo -e "${BLUE}=== 医疗后台关键流程联调检查 ===${NC}"
echo "后端地址: $BASE_URL"
echo "租户 ID : $TENANT_ID"
echo "账号     : $USERNAME"
echo

TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] 登录获取 Token ... "
login_payload="{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
request_api "POST" "/system/auth/login" "$login_payload"
if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
  TOKEN="$(echo "$RESPONSE_BODY" | jq -r '.data.accessToken // empty')"
  if [[ -n "$TOKEN" ]]; then
    pass
  else
    fail
    echo -e "${RED}登录成功但未返回 accessToken，终止检查${NC}"
    exit 1
  fi
else
  fail
  echo -e "${RED}登录失败，终止检查${NC}"
  exit 1
fi

TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] 权限信息可读取 ... "
request_api "GET" "/system/auth/get-permission-info"
if [[ "$HTTP_CODE" == "200" && "$BIZ_CODE" == "0" ]]; then
  pass
  perms="$(echo "$RESPONSE_BODY" | jq -r '.data.permissions[]?' 2>/dev/null)"
  for required in \
    "product:brand:query" \
    "product:category:query" \
    "product:spu:query" \
    "member:level:query" \
    "trade:delivery:express:query"; do
    if echo "$perms" | grep -qx "$required"; then
      echo "    - 权限存在: $required"
    else
      warn "缺少权限: $required（对应菜单可能被隐藏或进入后被拦截）"
    fi
  done
else
  fail
fi

run_check "药品分类列表" "GET" "/product/category/list"
run_check "药品品牌精简列表" "GET" "/product/brand/list-all-simple"
run_check "药品品牌分页" "GET" "/product/brand/page?pageNo=1&pageSize=5"
run_check "药品精简列表(库存下拉)" "GET" "/product/spu/list-all-simple"
run_check "物流公司精简列表(发货下拉)" "GET" "/trade/delivery/express/list-all-simple"
run_check "物流公司管理分页" "GET" "/trade/delivery/express/page?pageNo=1&pageSize=5" "optional"
run_check "会员等级精简列表(会员编辑下拉)" "GET" "/member/level/list-all-simple"
run_check "会员等级管理列表" "GET" "/member/level/list" "optional"

echo
echo -e "${BLUE}=== 检查结果 ===${NC}"
echo "总项: $TOTAL"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "告警: ${YELLOW}$WARNED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi

exit 0
