<template>
  <div class="app-container">
    <PageHero
      title="医保管理中心"
      description="查看医保卡状态并进行启用/禁用管理。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="用户姓名" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="请输入用户姓名" clearable />
        </el-form-item>
        <el-form-item label="医保卡号" prop="cardNo">
          <el-input v-model="queryParams.cardNo" placeholder="请输入医保卡号" clearable />
        </el-form-item>
        <el-form-item label="卡状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择卡状态" clearable :empty-values="[null]">
            <el-option label="已启用" :value="1" />
            <el-option label="已禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <InsuranceDetail ref="detailRef" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="name" label="持卡人姓名" />
        <el-table-column prop="cardNo" label="医保卡号" />
        <el-table-column prop="idCard" label="身份证号" />
        <el-table-column label="医保类型" width="120">
          <template #default="{ row }">
            {{ formatCardType(row.cardType) }}
          </template>
        </el-table-column>
        <el-table-column label="账户余额" width="120">
          <template #default="{ row }">
            {{ formatBalance(row.balance) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="卡状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">已启用</el-tag>
            <el-tag v-else type="danger">已禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bindTime" label="绑定时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status !== 1" link type="success" @click="handleApprove(row)">启用</el-button>
            <el-button v-else link type="danger" @click="handleReject(row)">禁用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/hooks/useTable'
import * as InsuranceApi from '@/api/pharmacy/insurance'
import type { InsurancePageReqVO } from '@/api/pharmacy/insurance'
import PageHero from '@/components/PageHero.vue'
import InsuranceDetail from './InsuranceDetail.vue'

const queryFormRef = ref()
const detailRef = ref()

const queryParams = reactive<InsurancePageReqVO>({
  userName: '',
  cardNo: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange, handleReset } = useTable({
  fetchData: InsuranceApi.getInsurancePage,
  queryParams
})

const formatCardType = (cardType?: number) => {
  if (cardType === 1) return '职工医保'
  if (cardType === 2) return '居民医保'
  return '未知'
}

const formatBalance = (balance?: number) => `¥${((balance || 0) / 100).toFixed(2)}`

const heroStats = computed(() => [
  {
    label: '医保卡总量',
    value: total.value,
    helper: '筛选结果',
    tone: 'primary'
  },
  {
    label: '启用占比',
    value:
      tableData.value.length > 0
        ? `${Math.round((tableData.value.filter((item) => item.status === 1).length / tableData.value.length) * 100)}%`
        : '0%',
    helper: '当前页',
    tone: 'warning'
  },
  {
    label: '已启用',
    value: tableData.value.filter((item) => item.status === 1).length,
    helper: '当前页',
    tone: 'success'
  },
  {
    label: '已禁用',
    value: tableData.value.filter((item) => item.status === 0).length,
    helper: '当前页',
    tone: 'danger'
  }
])

const handleDetail = (row: any) => {
  detailRef.value?.open(row.id)
}

const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定启用该医保卡吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await InsuranceApi.approveInsurance(row.id)
    ElMessage.success('启用成功')
    await getList()
  } catch (error) {
    // 用户取消操作
  }
}

const handleReject = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入禁用原因', '禁用医保卡', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入禁用原因'
    })
    await InsuranceApi.rejectInsurance(row.id, value)
    ElMessage.success('禁用成功')
    await getList()
  } catch (error) {
    // 用户取消操作
  }
}

onMounted(() => {
  getList()
})
</script>
