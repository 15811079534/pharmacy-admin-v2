<template>
  <el-dialog
    v-model="dialogVisible"
    title="售后详情"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-descriptions :column="2" border v-loading="loading">
      <el-descriptions-item label="售后单号">{{ aftersaleData.aftersaleNo }}</el-descriptions-item>
      <el-descriptions-item label="订单号">{{ aftersaleData.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="用户">{{ aftersaleData.userName }}</el-descriptions-item>
      <el-descriptions-item label="售后类型">
        <el-tag :type="aftersaleData.type === 1 ? 'warning' : 'danger'">
          {{ aftersaleData.type === 1 ? '退款' : '退货退款' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="退款金额">
        <span class="text-price">¥{{ aftersaleData.amount }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag v-if="aftersaleData.status === 0" type="warning">待审核</el-tag>
        <el-tag v-else-if="aftersaleData.status === 1" type="success">已同意</el-tag>
        <el-tag v-else-if="aftersaleData.status === 2" type="danger">已拒绝</el-tag>
        <el-tag v-else type="info">已完成</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="申请时间">{{ aftersaleData.createTime }}</el-descriptions-item>
      <el-descriptions-item label="售后原因" :span="2">{{ aftersaleData.reason }}</el-descriptions-item>
    </el-descriptions>

    <el-divider content-position="left">凭证图片</el-divider>

    <div v-if="aftersaleData.images && aftersaleData.images.length > 0" class="image-list">
      <el-image
        v-for="(image, index) in aftersaleData.images"
        :key="index"
        :src="image"
        :preview-src-list="aftersaleData.images"
        :initial-index="index"
        fit="cover"
        class="image-item"
      />
    </div>
    <el-empty v-else description="暂无凭证图片" :image-size="100" />

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as AftersaleApi from '@/api/order/aftersale'
import type { AftersaleVO } from '@/api/order/aftersale'

const dialogVisible = ref(false)
const loading = ref(false)
const aftersaleData = ref<AftersaleVO>({
  aftersaleNo: '',
  orderNo: '',
  userName: '',
  type: 1,
  amount: 0,
  reason: '',
  status: 0,
  images: []
})

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true

  try {
    const data = await AftersaleApi.getAftersale(id)
    aftersaleData.value = data
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

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
}
</style>
