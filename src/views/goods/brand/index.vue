<template>
  <div class="app-container">
    <PageHero
      title="商品品牌管理"
      description="统一维护品牌档案与状态，保障药品录入时可快速选择合规品牌。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="品牌名称">
          <el-input v-model="queryParams.name" placeholder="请输入品牌名称" clearable />
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

    <BrandForm ref="formRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="logo" label="品牌图片" width="120">
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
        <el-table-column prop="name" label="品牌名称" min-width="180" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="品牌描述" min-width="220" show-overflow-tooltip />
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
import * as BrandApi from '@/api/goods/brand'
import type { BrandPageReqVO } from '@/api/goods/brand'
import PageHero from '@/components/PageHero.vue'
import BrandForm from './BrandForm.vue'

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive<BrandPageReqVO>({
  name: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: BrandApi.getBrandPage,
  queryParams
})

const heroStats = computed(() => [
  {
    label: '品牌总数',
    value: total.value,
    helper: '筛选结果',
    tone: 'primary'
  },
  {
    label: '启用品牌',
    value: tableData.value.filter((item) => item.status === 0).length,
    helper: '当前页',
    tone: 'success'
  },
  {
    label: '禁用品牌',
    value: tableData.value.filter((item) => item.status === 1).length,
    helper: '当前页',
    tone: 'warning'
  },
  {
    label: '缺图片品牌',
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
    await ElMessageBox.confirm('确定要删除该品牌吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await BrandApi.deleteBrand(row.id)
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
