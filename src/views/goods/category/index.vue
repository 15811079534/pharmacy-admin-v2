<template>
  <div class="app-container">
    <PageHero
      title="药品分类管理"
      description="维护层级分类结构与状态配置，为商品检索与推荐提供准确目录。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="分类名称">
          <el-input v-model="queryParams.name" placeholder="请输入分类名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="分类名称" width="200" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-image v-if="row.icon" :src="row.icon" style="width: 40px; height: 40px" fit="cover" />
          </template>
        </el-table-column>
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
    </el-card>

    <CategoryForm ref="formRef" @success="handleQuery" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as CategoryApi from '@/api/goods/category'
import type { CategoryVO, CategoryPageReqVO } from '@/api/goods/category'
import PageHero from '@/components/PageHero.vue'
import CategoryForm from './CategoryForm.vue'

const queryParams = reactive<CategoryPageReqVO>({
  name: '',
  status: undefined
})

const tableData = ref<CategoryVO[]>([])
const loading = ref(false)
const formRef = ref()

const flattenCategories = (list: CategoryVO[]): CategoryVO[] => {
  return list.reduce<CategoryVO[]>((acc, item) => {
    acc.push(item)
    if (item.children?.length) {
      acc.push(...flattenCategories(item.children))
    }
    return acc
  }, [])
}

const heroStats = computed(() => {
  const allCategories = flattenCategories(tableData.value)
  return [
    {
      label: '分类总数',
      value: allCategories.length,
      helper: '含子分类',
      tone: 'primary'
    },
    {
      label: '启用分类',
      value: allCategories.filter((item) => item.status === 0).length,
      helper: '当前结果',
      tone: 'success'
    },
    {
      label: '禁用分类',
      value: allCategories.filter((item) => item.status === 1).length,
      helper: '当前结果',
      tone: 'warning'
    },
    {
      label: '最高排序值',
      value: allCategories.length ? Math.max(...allCategories.map((item) => Number(item.sort || 0))) : 0,
      helper: '用于优先级',
      tone: 'info'
    }
  ]
})

const handleQuery = async () => {
  loading.value = true
  try {
    const data = await CategoryApi.getCategoryList(queryParams)
    tableData.value = data
  } catch (error) {
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.name = ''
  queryParams.status = undefined
  handleQuery()
}

const handleAdd = () => {
  formRef.value?.openDialog('create')
}

const handleEdit = (row: CategoryVO) => {
  formRef.value?.openDialog('update', row.id)
}

const handleDelete = (row: CategoryVO) => {
  ElMessageBox.confirm('确定要删除该分类吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await CategoryApi.deleteCategory(row.id!)
        ElMessage.success('删除成功')
        handleQuery()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {
      // 用户取消删除
    })
}

onMounted(() => {
  handleQuery()
})
</script>
