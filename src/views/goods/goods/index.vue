<template>
  <div class="app-container">
    <PageHero
      title="药品档案管理"
      description="统一维护药品上架状态、分类信息和库存基础数据，保障商品数据准确。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="药品名称">
          <el-input v-model="queryParams.name" placeholder="请输入药品名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable>
            <el-option label="全部" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="上架" :value="0" />
            <el-option label="下架" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
          <el-button type="warning" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <GoodsForm ref="formRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="image" label="图片" width="100">
          <template #default="{ row }">
            <el-image :src="row.image" style="width: 60px; height: 60px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="药品名称" />
        <el-table-column prop="categoryName" label="分类" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }"> ¥{{ row.price }} </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="sales" label="销量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '上架' : '下架' }}
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
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTable } from '@/hooks/useTable'
import * as GoodsApi from '@/api/goods/goods'
import type { GoodsPageReqVO } from '@/api/goods/goods'
import PageHero from '@/components/PageHero.vue'
import GoodsForm from './GoodsForm.vue'

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive<GoodsPageReqVO>({
  name: '',
  categoryId: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: GoodsApi.getGoodsPage,
  queryParams
})

const heroStats = computed(() => {
  const totalStock = tableData.value.reduce((sum, item) => sum + Number(item.stock || 0), 0)
  return [
    {
      label: '药品总数',
      value: total.value,
      helper: '筛选结果',
      tone: 'primary'
    },
    {
      label: '上架数量',
      value: tableData.value.filter((item) => item.status === 0).length,
      helper: '当前页',
      tone: 'success'
    },
    {
      label: '库存低于20',
      value: tableData.value.filter((item) => Number(item.stock || 0) < 20).length,
      helper: '当前页',
      tone: 'warning'
    },
    {
      label: '当前页库存',
      value: totalStock,
      helper: '动态汇总',
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
    await ElMessageBox.confirm('确定要删除该药品吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await GoodsApi.deleteGoods(row.id)
    ElMessage.success('删除成功')
    await getList()
  } catch (error) {
    // 用户取消删除
  }
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确定要导出数据吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await GoodsApi.exportGoods(queryParams)
    ElMessage.success('导出成功')
  } catch (error) {
    // 用户取消导出
  }
}

const handleSuccess = () => {
  getList()
}

onMounted(() => {
  getList()
})
</script>
