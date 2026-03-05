<template>
  <div class="app-container">
    <PageHero
      title="售后工单中心"
      description="统一审核退款与退货退款申请，缩短处理时长并提升售后满意度。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="售后单号">
          <el-input v-model="queryParams.aftersaleNo" placeholder="请输入售后单号" clearable />
        </el-form-item>
        <el-form-item label="售后类型">
          <el-select v-model="queryParams.type" placeholder="请选择售后类型" clearable>
            <el-option label="退款" :value="1" />
            <el-option label="退货退款" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" :value="0" />
            <el-option label="已同意" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <AftersaleDetail ref="detailRef" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="aftersaleNo" label="售后单号" width="180" />
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户" />
        <el-table-column prop="type" label="售后类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'warning' : 'danger'">
              {{ row.type === 1 ? '退款' : '退货退款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="退款金额" width="120">
          <template #default="{ row }"> ¥{{ row.amount }} </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已同意</el-tag>
            <el-tag v-else-if="row.status === 2" type="danger">已拒绝</el-tag>
            <el-tag v-else type="info">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 0" link type="success" @click="handleApprove(row)">同意</el-button>
            <el-button v-if="row.status === 0" link type="danger" @click="handleReject(row)">拒绝</el-button>
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
import * as AftersaleApi from '@/api/order/aftersale'
import type { AftersalePageReqVO } from '@/api/order/aftersale'
import PageHero from '@/components/PageHero.vue'
import AftersaleDetail from './AftersaleDetail.vue'

const queryFormRef = ref()
const detailRef = ref()

const queryParams = reactive<AftersalePageReqVO>({
  aftersaleNo: '',
  type: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: AftersaleApi.getAftersalePage,
  queryParams
})

const heroStats = computed(() => {
  const amount = tableData.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return [
    {
      label: '售后工单',
      value: total.value,
      helper: '筛选结果',
      tone: 'primary'
    },
    {
      label: '待审核',
      value: tableData.value.filter((item) => item.status === 0).length,
      helper: '当前页',
      tone: 'warning'
    },
    {
      label: '已同意',
      value: tableData.value.filter((item) => item.status === 1).length,
      helper: '当前页',
      tone: 'success'
    },
    {
      label: '当前页退款额',
      value: `¥${amount.toFixed(2)}`,
      helper: '动态汇总',
      tone: 'info'
    }
  ]
})

const handleDetail = (row: any) => {
  detailRef.value?.open(row.id)
}

const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定同意该售后申请吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await AftersaleApi.approveAftersale(row.id)
    ElMessage.success('审核通过')
    await getList()
  } catch (error) {
    // 用户取消操作
  }
}

const handleReject = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因'
    })
    await AftersaleApi.rejectAftersale(row.id, value)
    ElMessage.success('审核拒绝')
    await getList()
  } catch (error) {
    // 用户取消操作
  }
}

onMounted(() => {
  getList()
})
</script>
