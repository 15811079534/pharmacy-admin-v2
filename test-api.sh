#!/bin/bash

# 接口测试脚本
# 测试所有后端接口是否正常

BASE_URL="http://localhost:48080/admin-api"
TENANT_ID="1"

echo "========================================="
echo "  医疗管理系统 - 接口测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4

    echo -n "测试 $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "tenant-id: $TENANT_ID" "$BASE_URL$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -H "tenant-id: $TENANT_ID" -d "$data" "$BASE_URL$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        # echo "  响应: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        echo "  响应: $body"
    fi
}

echo "1. 测试认证接口"
echo "-------------------"
test_api "登录接口" "/system/auth/login" "POST" '{"username":"admin","password":"admin123"}'
echo ""

echo "2. 测试系统管理接口"
echo "-------------------"
test_api "用户分页" "/system/user/page?pageNo=1&pageSize=10"
test_api "角色分页" "/system/role/page?pageNo=1&pageSize=10"
test_api "菜单列表" "/system/menu/list"
test_api "部门列表" "/system/dept/list"
test_api "字典分页" "/system/dict-data/page?pageNo=1&pageSize=10"
echo ""

echo "3. 测试药品管理接口"
echo "-------------------"
test_api "药品分页" "/product/spu/page?pageNo=1&pageSize=10"
test_api "分类列表" "/product/category/list"
test_api "库存分页" "/product/sku/page?pageNo=1&pageSize=10"
echo ""

echo "4. 测试订单管理接口"
echo "-------------------"
test_api "订单分页" "/trade/order/page?pageNo=1&pageSize=10"
test_api "售后分页" "/trade/after-sale/page?pageNo=1&pageSize=10"
test_api "物流分页" "/trade/delivery/page?pageNo=1&pageSize=10"
echo ""

echo "5. 测试医疗业务接口"
echo "-------------------"
test_api "门店列表" "/trade/pharmacy-store/list"
test_api "处方分页" "/trade/prescription/page?pageNo=1&pageSize=10"
test_api "药师分页" "/trade/pharmacist/page?pageNo=1&pageSize=10"
test_api "医保分页" "/trade/insurance/page?pageNo=1&pageSize=10"
echo ""

echo "6. 测试会员管理接口"
echo "-------------------"
test_api "会员分页" "/member/user/page?pageNo=1&pageSize=10"
test_api "等级分页" "/member/level/page?pageNo=1&pageSize=10"
test_api "余额分页" "/member/wallet/page?pageNo=1&pageSize=10"
echo ""

echo "7. 测试评价管理接口"
echo "-------------------"
test_api "评价分页" "/product/comment/page?pageNo=1&pageSize=10"
echo ""

echo "8. 测试支付管理接口"
echo "-------------------"
test_api "支付分页" "/pay/order/page?pageNo=1&pageSize=10"
test_api "退款分页" "/pay/refund/page?pageNo=1&pageSize=10"
echo ""

echo "9. 测试营销管理接口"
echo "-------------------"
test_api "轮播图分页" "/promotion/banner/page?pageNo=1&pageSize=10"
test_api "公告分页" "/system/notice/page?pageNo=1&pageSize=10"
echo ""

echo "10. 测试日志管理接口"
echo "-------------------"
test_api "登录日志" "/system/login-log/page?pageNo=1&pageSize=10"
test_api "操作日志" "/system/operate-log/page?pageNo=1&pageSize=10"
echo ""

echo "========================================="
echo "  测试完成"
echo "========================================="
