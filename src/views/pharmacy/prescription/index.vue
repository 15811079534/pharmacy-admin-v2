<template>
  <div class="app-container">
    <PageHero
      title="处方审核中心"
      description="聚焦处方合规审核与异常拦截，保障线上问诊与购药流程安全可追溯。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="处方编号" prop="prescriptionNo">
          <el-input v-model="queryParams.prescriptionNo" placeholder="请输入处方编号" clearable />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model.number="queryParams.userId" placeholder="请输入用户ID" clearable />
        </el-form-item>
        <el-form-item label="审核状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择审核状态"
            clearable
            :empty-values="[null]"
          >
            <el-option label="待审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="审核拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <PrescriptionDetail ref="detailRef" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="prescriptionNo" label="处方编号" width="180" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="orderId" label="订单ID" width="100" />
        <el-table-column label="处方图片" width="110">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrls?.length"
              :src="row.imageUrls[0]"
              style="width: 56px; height: 56px"
              fit="cover"
              :preview-src-list="row.imageUrls"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">审核通过</el-tag>
            <el-tag v-else type="danger">审核拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditTime" label="审核时间" width="180" />
        <el-table-column prop="createTime" label="提交时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 0 && canAudit"
              link
              type="success"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 0 && canAudit"
              link
              type="danger"
              @click="handleReject(row)"
            >
              拒绝
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
import * as PrescriptionApi from '@/api/pharmacy/prescription'
import type { PrescriptionPageReqVO } from '@/api/pharmacy/prescription'
import { useUserStore } from '@/stores/user'
import { hasPermission } from '@/utils/permission'
import PageHero from '@/components/PageHero.vue'
import PrescriptionDetail from './PrescriptionDetail.vue'

const queryFormRef = ref()
const detailRef = ref()
const userStore = useUserStore()

const queryParams = reactive<PrescriptionPageReqVO>({
  prescriptionNo: '',
  userId: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange } = useTable({
  fetchData: PrescriptionApi.getPrescriptionPage,
  queryParams
})

const canAudit = computed(() =>
  hasPermission(userStore.permissions, 'trade:prescription:audit')
)

const heroStats = computed(() => [
  {
    label: '处方总量',
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
    label: '已通过',
    value: tableData.value.filter((item) => item.status === 1).length,
    helper: '当前页',
    tone: 'success'
  },
  {
    label: '已拒绝',
    value: tableData.value.filter((item) => item.status === 2).length,
    helper: '当前页',
    tone: 'danger'
  }
])

const handleDetail = (row: any) => {
  detailRef.value?.open(row.id)
}

const handleResetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.prescriptionNo = ''
  queryParams.userId = undefined
  queryParams.status = undefined
  handleQuery()
}

const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定审核通过该处方吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await PrescriptionApi.approvePrescription(row.id)
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
    await PrescriptionApi.rejectPrescription(row.id, value)
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
