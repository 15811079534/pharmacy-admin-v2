<template>
  <el-dialog
    v-model="dialogVisible"
    title="物流跟踪"
    width="600px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <el-descriptions :column="1" border class="logistics-info">
        <el-descriptions-item label="订单号">{{ logisticsData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ logisticsData.trackingNo }}</el-descriptions-item>
        <el-descriptions-item label="物流公司">{{ getCompanyName(logisticsData.company) }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ logisticsData.receiver }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ logisticsData.phone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ logisticsData.address }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">物流轨迹</el-divider>

      <el-timeline v-if="trackList.length > 0">
        <el-timeline-item
          v-for="(item, index) in trackList"
          :key="index"
          :timestamp="item.time"
          placement="top"
          :type="index === 0 ? 'primary' : 'info'"
        >
          <div class="track-content">
            <div class="track-status">{{ item.status }}</div>
            <div v-if="item.location" class="track-location">{{ item.location }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无物流信息" />
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="handleRefresh" :loading="loading">刷新</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as LogisticsApi from '@/api/order/logistics'
import type { LogisticsVO, LogisticsTrackVO } from '@/api/order/logistics'

const dialogVisible = ref(false)
const loading = ref(false)
const logisticsId = ref<number>()
const companyOptions = ref<Array<{ id: number; name: string }>>([])

const logisticsData = ref<LogisticsVO>({
  orderNo: '',
  trackingNo: '',
  company: '',
  receiver: '',
  phone: '',
  address: '',
  status: 0
})

const trackList = ref<LogisticsTrackVO[]>([])

const getCompanyName = (code: string) => {
  if (logisticsData.value.companyName) {
    return logisticsData.value.companyName
  }
  const match = companyOptions.value.find((item) => String(item.id) === String(code))
  return match?.name || code
}

const open = async (id: number) => {
  logisticsId.value = id
  dialogVisible.value = true
  await loadCompanyOptions()
  await loadData()
}

const loadCompanyOptions = async () => {
  try {
    companyOptions.value = await LogisticsApi.getExpressCompanyList()
  } catch (error) {
    companyOptions.value = []
  }
}

const loadData = async () => {
  loading.value = true

  try {
    const [logistics, tracks] = await Promise.all([
      LogisticsApi.getLogistics(logisticsId.value!),
      LogisticsApi.trackLogistics(logisticsId.value!)
    ])

    logisticsData.value = logistics
    trackList.value = tracks
  } catch (error) {
    ElMessage.error('获取物流信息失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  await loadData()
  ElMessage.success('刷新成功')
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.logistics-info {
  margin-bottom: 20px;
}

.el-divider {
  margin: 20px 0;
}

.track-content {
  .track-status {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
  }

  .track-location {
    font-size: 12px;
    color: #909399;
  }
}

.el-timeline {
  padding-left: 10px;
}
</style>
