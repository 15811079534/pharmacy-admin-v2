<template>
  <div class="app-container">
    <PageHero
      title="门店运营管理"
      description="统一管理门店基础信息、营业状态与配送能力，支持区域运营决策。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入门店名称" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable :empty-values="[null]">
            <el-option
              v-for="option in STORE_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <StoreForm ref="formRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="门店名称" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="businessHours" label="营业时间" />
        <el-table-column prop="deliveryRadius" label="配送范围" width="120">
          <template #default="{ row }"> {{ row.deliveryRadius }}km </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStoreStatusMeta(row.status).tagType">
              {{ getStoreStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
import * as StoreApi from '@/api/pharmacy/store'
import type { StorePageReqVO } from '@/api/pharmacy/store'
import { getStoreStatusMeta, STORE_STATUS_OPTIONS } from '@/api/pharmacy/store'
import PageHero from '@/components/PageHero.vue'
import StoreForm from './StoreForm.vue'

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive<StorePageReqVO>({
  name: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange, handleReset } = useTable({
  fetchData: StoreApi.getStorePage,
  queryParams
})

const heroStats = computed(() => {
  const avgRadius = tableData.value.length
    ? (
        tableData.value.reduce((sum, item) => sum + Number(item.deliveryRadius || 0), 0) /
        tableData.value.length
      ).toFixed(1)
    : '0.0'

  return [
    {
      label: '门店总数',
      value: total.value,
      helper: '筛选结果',
      tone: 'primary'
    },
    {
      label: '营业中',
      value: tableData.value.filter((item) => item.status === 1).length,
      helper: '当前页',
      tone: 'success'
    },
    {
      label: '休息中',
      value: tableData.value.filter((item) => item.status === 0).length,
      helper: '当前页',
      tone: 'warning'
    },
    {
      label: '平均配送半径',
      value: `${avgRadius} km`,
      helper: '当前页',
      tone: 'info'
    }
  ]
})

const handleAdd = () => {
  formRef.value?.openDialog('create')
}

const handleEdit = (row: any) => {
  formRef.value?.openDialog('update', row.id)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该门店吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await StoreApi.deleteStore(row.id)
    ElMessage.success('删除成功')
    await getList()
  } catch (error) {
    // 用户取消删除
  }
}

const handleSuccess = () => {
  getList()
}

onMounted(() => {
  getList()
})
</script>
