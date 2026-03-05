<template>
  <div class="app-container">
    <PageHero
      title="物流监控中心"
      description="监控物流节点状态，快速跟踪异常件并及时更新配送信息。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="物流单号">
          <el-input v-model="queryParams.trackingNo" placeholder="请输入物流单号" clearable />
        </el-form-item>
        <el-form-item label="物流公司">
          <el-select v-model="queryParams.company" placeholder="请选择物流公司" clearable>
            <el-option
              v-for="item in companyOptions"
              :key="item.id"
              :label="item.name"
              :value="String(item.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="待揽件" :value="0" />
            <el-option label="运输中" :value="1" />
            <el-option label="派送中" :value="2" />
            <el-option label="已签收" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <LogisticsTrack ref="trackRef" />
    <UpdateForm ref="updateRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="trackingNo" label="物流单号" width="180" />
        <el-table-column prop="company" label="物流公司" width="120">
          <template #default="{ row }"> {{ getCompanyName(row) }} </template>
        </el-table-column>
        <el-table-column prop="receiver" label="收货人" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info">待揽件</el-tag>
            <el-tag v-else-if="row.status === 1" type="primary">运输中</el-tag>
            <el-tag v-else-if="row.status === 2" type="warning">派送中</el-tag>
            <el-tag v-else type="success">已签收</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发货时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleTrack(row)">物流跟踪</el-button>
            <el-button link type="success" @click="handleUpdate(row)">更新</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/hooks/useTable'
import * as LogisticsApi from '@/api/order/logistics'
import type { LogisticsPageReqVO } from '@/api/order/logistics'
import PageHero from '@/components/PageHero.vue'
import LogisticsTrack from './LogisticsTrack.vue'
import UpdateForm from './UpdateForm.vue'

const queryFormRef = ref()
const trackRef = ref()
const updateRef = ref()
const companyOptions = ref<Array<{ id: number; name: string }>>([])

const queryParams = reactive<LogisticsPageReqVO>({
  trackingNo: '',
  company: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: LogisticsApi.getLogisticsPage,
  queryParams
})

const heroStats = computed(() => [
  {
    label: '物流单量',
    value: total.value,
    helper: '筛选结果',
    tone: 'primary'
  },
  {
    label: '运输中',
    value: tableData.value.filter((item) => item.status === 1).length,
    helper: '当前页',
    tone: 'info'
  },
  {
    label: '派送中',
    value: tableData.value.filter((item) => item.status === 2).length,
    helper: '当前页',
    tone: 'warning'
  },
  {
    label: '已签收',
    value: tableData.value.filter((item) => item.status === 3).length,
    helper: '当前页',
    tone: 'success'
  }
])

const getCompanyName = (row: any) => {
  if (row.companyName) {
    return row.companyName
  }
  const match = companyOptions.value.find((item) => String(item.id) === String(row.company))
  return match?.name || row.company || '-'
}

const handleTrack = (row: any) => {
  trackRef.value?.open(row.id)
}

const handleUpdate = (row: any) => {
  updateRef.value?.open(row.id)
}

const handleSuccess = () => {
  getList()
}

const loadCompanyOptions = async () => {
  try {
    companyOptions.value = await LogisticsApi.getExpressCompanyList()
  } catch (error) {
    companyOptions.value = []
  }
}

onMounted(async () => {
  await loadCompanyOptions()
  getList()
})
</script>
