<template>
  <div class="app-container">
    <PageHero
      title="会员等级管理"
      description="维护会员等级规则与折扣权益，保障会员编辑和筛选流程可闭环操作。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="等级名称">
          <el-input v-model="queryParams.name" placeholder="请输入等级名称" clearable />
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

    <LevelForm ref="formRef" @success="handleSuccess" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="icon" label="图标" width="90">
          <template #default="{ row }">
            <el-image
              v-if="row.icon"
              :src="row.icon"
              style="width: 36px; height: 36px; border-radius: 8px"
              fit="cover"
              preview-teleported
            />
            <span v-else class="muted-text">未配置</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="等级名称" min-width="180" />
        <el-table-column prop="level" label="等级值" width="90" />
        <el-table-column prop="experience" label="升级经验" width="120" />
        <el-table-column prop="discountPercent" label="折扣" width="110">
          <template #default="{ row }">
            <el-tag :type="row.discountPercent < 100 ? 'danger' : 'info'">
              {{ row.discountPercent }}%
            </el-tag>
          </template>
        </el-table-column>
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
import * as MemberLevelApi from '@/api/member/level'
import PageHero from '@/components/PageHero.vue'
import LevelForm from './LevelForm.vue'

interface MemberLevelQueryParams {
  name?: string
  status?: number
  pageNo: number
  pageSize: number
}

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive<MemberLevelQueryParams>({
  name: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const fetchData = async (params: MemberLevelQueryParams) => {
  const list = await MemberLevelApi.getMemberLevelList({
    name: params.name,
    status: params.status
  })
  const sortedList = [...list].sort((a, b) => a.level - b.level)
  const start = (params.pageNo - 1) * params.pageSize
  return {
    list: sortedList.slice(start, start + params.pageSize),
    total: sortedList.length
  }
}

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData,
  queryParams
})

const heroStats = computed(() => [
  {
    label: '等级总数',
    value: total.value,
    helper: '筛选结果',
    tone: 'primary'
  },
  {
    label: '启用等级',
    value: tableData.value.filter((item) => item.status === 0).length,
    helper: '当前页',
    tone: 'success'
  },
  {
    label: '禁用等级',
    value: tableData.value.filter((item) => item.status === 1).length,
    helper: '当前页',
    tone: 'warning'
  },
  {
    label: '有折扣等级',
    value: tableData.value.filter((item) => item.discountPercent < 100).length,
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
    await ElMessageBox.confirm('确定要删除该会员等级吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await MemberLevelApi.deleteMemberLevel(row.id)
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
