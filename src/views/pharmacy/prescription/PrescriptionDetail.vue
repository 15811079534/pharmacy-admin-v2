<template>
  <el-dialog
    v-model="dialogVisible"
    title="处方详情"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-descriptions :column="2" border v-loading="loading">
      <el-descriptions-item label="处方编号">{{ prescriptionData.prescriptionNo }}</el-descriptions-item>
      <el-descriptions-item label="用户ID">{{ prescriptionData.userId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单ID">{{ prescriptionData.orderId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核人ID">{{ prescriptionData.auditUserId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核状态">
        <el-tag v-if="prescriptionData.status === 0" type="warning">待审核</el-tag>
        <el-tag v-else-if="prescriptionData.status === 1" type="success">审核通过</el-tag>
        <el-tag v-else type="danger">审核拒绝</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="审核时间">{{ prescriptionData.auditTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="提交时间">{{ prescriptionData.createTime || '-' }}</el-descriptions-item>
      <el-descriptions-item v-if="prescriptionData.rejectReason" label="驳回原因" :span="2">
        {{ prescriptionData.rejectReason }}
      </el-descriptions-item>
    </el-descriptions>

    <el-divider content-position="left">处方图片</el-divider>

    <div v-if="prescriptionData.imageUrls?.length" class="image-list">
      <el-image
        v-for="(url, index) in prescriptionData.imageUrls"
        :key="`${url}-${index}`"
        :src="url"
        class="prescription-image"
        fit="cover"
        :preview-src-list="prescriptionData.imageUrls"
        preview-teleported
      />
    </div>
    <el-empty v-else description="暂无处方图片" :image-size="100" />

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as PrescriptionApi from '@/api/pharmacy/prescription'
import type { PrescriptionVO } from '@/api/pharmacy/prescription'

const dialogVisible = ref(false)
const loading = ref(false)
const prescriptionData = ref<PrescriptionVO>({
  prescriptionNo: '',
  userId: undefined,
  orderId: undefined,
  imageUrls: [],
  status: 0,
  auditUserId: undefined,
  auditTime: '',
  rejectReason: '',
  createTime: ''
})

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true

  try {
    const data = await PrescriptionApi.getPrescription(id)
    prescriptionData.value = data
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.el-divider {
  margin: 20px 0;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.prescription-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}
</style>
