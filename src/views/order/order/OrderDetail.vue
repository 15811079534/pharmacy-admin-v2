<template>
  <el-dialog
    v-model="dialogVisible"
    title="订单详情"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-descriptions :column="2" border v-loading="loading">
      <el-descriptions-item label="订单号">{{ orderData.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="用户">{{ orderData.userName }}</el-descriptions-item>
      <el-descriptions-item label="订单金额">
        <span class="text-price">¥{{ orderData.totalAmount }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="支付方式">{{ orderData.payType }}</el-descriptions-item>
      <el-descriptions-item label="订单状态">
        <el-tag v-if="orderData.status === 0" type="warning">待支付</el-tag>
        <el-tag v-else-if="orderData.status === 1" type="primary">待发货</el-tag>
        <el-tag v-else-if="orderData.status === 2" type="info">待收货</el-tag>
        <el-tag v-else-if="orderData.status === 3" type="success">已完成</el-tag>
        <el-tag v-else type="danger">已取消</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="下单时间">{{ orderData.createTime }}</el-descriptions-item>
    </el-descriptions>

    <el-divider content-position="left">订单商品</el-divider>

    <el-table :data="orderData.items" border>
      <el-table-column prop="goodsName" label="商品名称" />
      <el-table-column prop="price" label="单价" width="120">
        <template #default="{ row }">
          ¥{{ row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="100" />
      <el-table-column prop="amount" label="小计" width="120">
        <template #default="{ row }">
          ¥{{ row.amount }}
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as OrderApi from '@/api/order/order'
import type { OrderVO } from '@/api/order/order'

const dialogVisible = ref(false)
const loading = ref(false)
const orderData = ref<OrderVO>({
  orderNo: '',
  userName: '',
  totalAmount: 0,
  status: 0,
  payType: '',
  items: []
})

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true

  try {
    const data = await OrderApi.getOrder(id)
    orderData.value = data
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.text-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.el-divider {
  margin: 20px 0;
}
</style>
