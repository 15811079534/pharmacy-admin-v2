<template>
  <div class="app-container">
    <PageHero
      title="公告内容中心"
      description="管理系统公告与活动通知，确保运营消息触达及时且内容一致。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="queryParams.title" placeholder="请输入公告标题" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable :empty-values="[null]">
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

    <NoticeForm ref="formRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="公告标题" />
        <el-table-column prop="content" label="公告内容" show-overflow-tooltip />
        <el-table-column prop="type" label="公告类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="success">系统公告</el-tag>
            <el-tag v-else-if="row.type === 2" type="warning">活动公告</el-tag>
            <el-tag v-else type="info">其他</el-tag>
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
import * as NoticeApi from '@/api/marketing/notice'
import type { NoticePageReqVO } from '@/api/marketing/notice'
import PageHero from '@/components/PageHero.vue'
import NoticeForm from './NoticeForm.vue'

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive<NoticePageReqVO>({
  title: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange, handleReset } = useTable({
  fetchData: NoticeApi.getNoticePage,
  queryParams
})

const heroStats = computed(() => [
  {
    label: '公告总数',
    value: total.value,
    helper: '筛选结果',
    tone: 'primary'
  },
  {
    label: '启用中',
    value: tableData.value.filter((item) => item.status === 0).length,
    helper: '当前页',
    tone: 'success'
  },
  {
    label: '活动公告',
    value: tableData.value.filter((item) => item.type === 2).length,
    helper: '当前页',
    tone: 'warning'
  },
  {
    label: '系统公告',
    value: tableData.value.filter((item) => item.type === 1).length,
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
    await ElMessageBox.confirm('确定要删除该公告吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await NoticeApi.deleteNotice(row.id)
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
