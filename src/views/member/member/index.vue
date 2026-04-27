<template>
  <div class="app-container">
    <PageHero
      title="会员增长与运营"
      description="追踪会员规模、等级分布与资产数据，提升会员留存和复购能力。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="会员昵称" prop="nickname">
          <el-input v-model="queryParams.nickname" placeholder="请输入会员昵称" clearable />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="会员等级" prop="levelId">
          <el-select v-model="queryParams.levelId" placeholder="请选择会员等级" clearable>
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <MemberForm ref="formRef" @success="handleSuccess" />
    <MemberDetail ref="detailRef" />

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="levelName" label="会员等级" />
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="{ row }"> ¥{{ row.balance }} </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="warning" @click="handleEdit(row)">编辑</el-button>
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
import * as MemberApi from '@/api/member/member'
import * as MemberLevelApi from '@/api/member/level'
import type { MemberPageReqVO } from '@/api/member/member'
import PageHero from '@/components/PageHero.vue'
import MemberForm from './MemberForm.vue'
import MemberDetail from './MemberDetail.vue'

const queryFormRef = ref()
const formRef = ref()
const detailRef = ref()
const levelOptions = ref<Array<{ value: number; label: string }>>([])

const queryParams = reactive<MemberPageReqVO>({
  nickname: '',
  phone: '',
  levelId: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange, handleReset } = useTable({
  fetchData: MemberApi.getMemberPage,
  queryParams
})

const highestLevel = computed<{ value: number; label: string }>(() => {
  const sorted = [...levelOptions.value].sort((a, b) => b.value - a.value)
  return sorted[0] || { value: 3, label: '等级 3' }
})

const heroStats = computed(() => {
  const balanceSum = tableData.value.reduce((sum, item) => sum + Number(item.balance || 0), 0)
  return [
    {
      label: '会员总数',
      value: total.value,
      helper: '筛选结果',
      tone: 'primary'
    },
    {
      label: '最高等级会员',
      value: tableData.value.filter((item) => item.levelId === highestLevel.value.value).length,
      helper: highestLevel.value.label,
      tone: 'success'
    },
    {
      label: '当前页余额汇总',
      value: `¥${balanceSum.toFixed(2)}`,
      helper: '动态计算',
      tone: 'info'
    },
    {
      label: '平均积分',
      value: tableData.value.length
        ? Math.round(
            tableData.value.reduce((sum, item) => sum + Number(item.points || 0), 0) /
              tableData.value.length
          )
        : 0,
      helper: '当前页',
      tone: 'warning'
    }
  ]
})

const handleDetail = (row: any) => {
  detailRef.value?.open(row.id)
}

const handleEdit = (row: any) => {
  formRef.value?.openDialog('update', row.id)
}

const handleSuccess = () => {
  getList()
}

const loadLevelOptions = async () => {
  try {
    const list = await MemberLevelApi.getMemberLevelSimpleList()
    levelOptions.value = list.map((item) => ({
      value: item.id,
      label: item.name || `等级#${item.id}`
    }))
  } catch (error) {
    ElMessage.warning('会员等级数据加载失败，筛选项可能不完整')
  }
}

onMounted(() => {
  Promise.all([loadLevelOptions(), getList()])
})
</script>
