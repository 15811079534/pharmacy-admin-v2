<template>
  <div class="app-container">
    <PageHero
      title="物流公司管理"
      description="维护发货可用物流公司，保障订单发货与物流更新流程顺畅。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="公司编码">
          <el-input v-model="queryParams.code" placeholder="请输入公司编码" clearable />
        </el-form-item>
        <el-form-item label="公司名称">
          <el-input v-model="queryParams.name" placeholder="请输入公司名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <ExpressForm ref="formRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="logo" label="Logo" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.logo"
              :src="row.logo"
              style="width: 70px; height: 40px; border-radius: 8px"
              fit="cover"
              preview-teleported
            />
            <span v-else class="muted-text">未上传</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="公司编码" width="150" />
        <el-table-column prop="name" label="公司名称" min-width="180" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
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
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/hooks/useTable'
import * as ExpressApi from '@/api/order/express'
import type { ExpressPageReqVO } from '@/api/order/express'
import PageHero from '@/components/PageHero.vue'
import ExpressForm from './ExpressForm.vue'

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive<ExpressPageReqVO>({
  code: '',
  name: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: ExpressApi.getExpressPage,
  queryParams
})

const heroStats = computed(() => [
  {
    label: '公司总数',
    value: total.value,
    helper: '筛选结果',
    tone: 'primary'
  },
  {
    label: '启用公司',
    value: tableData.value.filter((item) => item.status === 0).length,
    helper: '当前页',
    tone: 'success'
  },
  {
    label: '禁用公司',
    value: tableData.value.filter((item) => item.status === 1).length,
    helper: '当前页',
    tone: 'warning'
  },
  {
    label: '缺 Logo',
    value: tableData.value.filter((item) => !item.logo).length,
    helper: '当前页',
    tone: 'info'
  }
])

const handleAdd = () => {
  formRef.value?.openDialog('create')
}

const handleEdit = (row: any) => {
  formRef.value?.openDialog('update', row.id)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该物流公司吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await ExpressApi.deleteExpress(row.id)
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

<style scoped lang="scss">
.muted-text {
  color: #8fa6b2;
}
</style>
