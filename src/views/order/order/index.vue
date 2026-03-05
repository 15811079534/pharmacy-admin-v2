<template>
  <div class="app-container">
    <PageHero
      title="订单履约中心"
      description="集中处理订单状态、发货流程和异常取消，保障履约时效与用户体验。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
            <el-option label="待支付" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="queryParams.createTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <OrderDetail ref="detailRef" />
    <DeliverForm ref="deliverRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户" />
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }"> ¥{{ row.totalAmount }} </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待支付</el-tag>
            <el-tag v-else-if="row.status === 1" type="primary">待发货</el-tag>
            <el-tag v-else-if="row.status === 2" type="info">待收货</el-tag>
            <el-tag v-else-if="row.status === 3" type="success">已完成</el-tag>
            <el-tag v-else type="danger">已取消</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payType" label="支付方式" width="100" />
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 1" link type="success" @click="handleDeliver(row)">
              发货
            </el-button>
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
import * as OrderApi from '@/api/order/order'
import type { OrderPageReqVO } from '@/api/order/order'
import PageHero from '@/components/PageHero.vue'
import OrderDetail from './OrderDetail.vue'
import DeliverForm from './DeliverForm.vue'

const queryFormRef = ref()
const detailRef = ref()
const deliverRef = ref()

const queryParams = reactive<OrderPageReqVO>({
  orderNo: '',
  status: undefined,
  createTime: [],
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: OrderApi.getOrderPage,
  queryParams
})

const heroStats = computed(() => {
  const currentPageTotal = tableData.value.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
  return [
    {
      label: '订单总量',
      value: total.value,
      helper: '按筛选条件统计',
      tone: 'primary'
    },
    {
      label: '待发货',
      value: tableData.value.filter((item) => item.status === 1).length,
      helper: '当前页',
      tone: 'warning'
    },
    {
      label: '已完成',
      value: tableData.value.filter((item) => item.status === 3).length,
      helper: '当前页',
      tone: 'success'
    },
    {
      label: '当前页交易额',
      value: `¥${currentPageTotal.toFixed(2)}`,
      helper: '动态汇总',
      tone: 'info'
    }
  ]
})

const handleDetail = (row: any) => {
  detailRef.value?.open(row.id)
}

const handleDeliver = (row: any) => {
  deliverRef.value?.open(row.id)
}

const handleSuccess = () => {
  getList()
}

onMounted(() => {
  getList()
})
</script>
