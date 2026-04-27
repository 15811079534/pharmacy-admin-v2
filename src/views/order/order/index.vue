<template>
  <div class="app-container">
    <PageHero
      title="订单履约中心"
      description="集中处理订单状态、发货流程和异常取消，保障履约时效与用户体验。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable :empty-values="[null]">
            <el-option
              v-for="option in ORDER_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.createTime"
            type="daterange"
            value-format="YYYY-MM-DD"
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
            <el-tag :type="getOrderStatusMeta(row.status).tagType">
              {{ getOrderStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payType" label="支付方式" width="100" />
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 10" link type="success" @click="handleDeliver(row)">
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
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/hooks/useTable'
import * as OrderApi from '@/api/order/order'
import type { OrderPageReqVO } from '@/api/order/order'
import { ORDER_STATUS_OPTIONS, getOrderStatusMeta } from '@/api/order/order'
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

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange, handleReset } = useTable({
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
      value: tableData.value.filter((item) => item.status === 10).length,
      helper: '当前页',
      tone: 'warning'
    },
    {
      label: '已完成',
      value: tableData.value.filter((item) => item.status === 30).length,
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
