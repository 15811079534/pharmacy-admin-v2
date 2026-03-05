<template>
  <el-dialog
    v-model="dialogVisible"
    title="医保卡详情"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-descriptions :column="2" border v-loading="loading">
      <el-descriptions-item label="用户ID">{{ insuranceData.userId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="持卡人姓名">{{ insuranceData.name }}</el-descriptions-item>
      <el-descriptions-item label="医保卡号">{{ insuranceData.cardNo }}</el-descriptions-item>
      <el-descriptions-item label="身份证号">{{ insuranceData.idCard }}</el-descriptions-item>
      <el-descriptions-item label="医保类型">{{ formatCardType(insuranceData.cardType) }}</el-descriptions-item>
      <el-descriptions-item label="账户余额">{{ formatBalance(insuranceData.balance) }}</el-descriptions-item>
      <el-descriptions-item label="卡状态">
        <el-tag v-if="insuranceData.status === 1" type="success">已启用</el-tag>
        <el-tag v-else type="danger">已禁用</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="绑定时间">{{ insuranceData.bindTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ insuranceData.createTime || '-' }}</el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as InsuranceApi from '@/api/pharmacy/insurance'
import type { InsuranceVO } from '@/api/pharmacy/insurance'

const dialogVisible = ref(false)
const loading = ref(false)
const insuranceData = ref<InsuranceVO>({
  userId: undefined,
  name: '',
  cardNo: '',
  idCard: '',
  cardType: undefined,
  balance: 0,
  status: 0
})

const formatCardType = (cardType?: number) => {
  if (cardType === 1) return '职工医保'
  if (cardType === 2) return '居民医保'
  return '未知'
}

const formatBalance = (balance?: number) => `¥${((balance || 0) / 100).toFixed(2)}`

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true

  try {
    const data = await InsuranceApi.getInsurance(id)
    insuranceData.value = data
  } catch (error) {
    ElMessage.error('获取医保卡详情失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.el-descriptions {
  margin-top: 20px;
}
</style>
