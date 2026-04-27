<template>
  <div class="app-container">
    <PageHero
      title="药品档案管理"
      :description="heroDescription"
      :stats="heroStats"
    />

    <el-card class="mode-card">
      <div class="mode-switch">
        <div>
          <p class="mode-title">列表视图</p>
          <p class="mode-hint">{{ modeHint }}</p>
        </div>
        <el-radio-group v-model="viewMode" @change="handleViewChange">
          <el-radio-button label="catalog">药品列表</el-radio-button>
          <el-radio-button label="recycle">回收站</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="药品名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入药品名称" clearable />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable>
            <el-option label="全部" :value="0" />
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isRecycleBin" label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable :empty-values="[null]">
            <el-option label="上架" :value="GoodsApi.GOODS_VIEW_STATUS.ON_SHELF" />
            <el-option label="下架" :value="GoodsApi.GOODS_VIEW_STATUS.OFF_SHELF" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
          <el-button v-if="!isRecycleBin && canCreate" type="success" @click="handleAdd">新增</el-button>
          <el-button v-if="canExport" type="warning" @click="handleExport">导出</el-button>
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
        <el-table-column prop="drugType" label="药品类型" width="130">
          <template #default="{ row }">
            <el-tag :type="GoodsApi.getDrugTypeMeta(row.drugType).tagType">
              {{ GoodsApi.getDrugTypeMeta(row.drugType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="prescriptionRequired" label="购买规则" width="130">
          <template #default="{ row }">
            <el-tag :type="row.prescriptionRequired ? 'danger' : 'success'">
              {{ row.prescriptionRequired ? '先审方后购买' : '可直接购买' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }"> ¥{{ row.price }} </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="sales" label="销量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusMeta(row.status).type">
              {{ getStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :width="isRecycleBin ? 220 : 240" label="操作" fixed="right">
          <template #default="{ row }">
            <template v-if="isRecycleBin">
              <el-button v-if="canUpdate" link type="warning" @click="handleRestore(row)">
                恢复为下架
              </el-button>
              <el-button v-if="canDelete" link type="danger" @click="handlePermanentDelete(row)">
                彻底删除
              </el-button>
            </template>
            <template v-else>
              <el-button v-if="canUpdate" link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button v-if="canUpdate" link type="danger" @click="handleRecycle(row)">
                移入回收站
              </el-button>
            </template>
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
import * as GoodsApi from '@/api/goods/goods'
import * as CategoryApi from '@/api/goods/category'
import type { GoodsPageReqVO, GoodsVO, GoodsViewStatus } from '@/api/goods/goods'
import { useUserStore } from '@/stores/user'
import { hasPermission } from '@/utils/permission'
import PageHero from '@/components/PageHero.vue'
import GoodsForm from './GoodsForm.vue'

const queryFormRef = ref()
const formRef = ref()
const userStore = useUserStore()
const viewMode = ref<'catalog' | 'recycle'>('catalog')
const categoryOptions = ref<Array<{ value: number; label: string }>>([])

const queryParams = reactive<GoodsPageReqVO>({
  name: '',
  categoryId: undefined,
  status: undefined,
  tabType: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handlePageChange, handlePageSizeChange, handleReset } = useTable({
  fetchData: GoodsApi.getGoodsPage,
  queryParams
})

const isRecycleBin = computed(() => viewMode.value === 'recycle')
const canCreate = computed(() => hasPermission(userStore.permissions, 'product:spu:create'))
const canUpdate = computed(() => hasPermission(userStore.permissions, 'product:spu:update'))
const canDelete = computed(() => hasPermission(userStore.permissions, 'product:spu:delete'))
const canExport = computed(() => hasPermission(userStore.permissions, 'product:spu:export'))

const statusMetaMap: Record<GoodsViewStatus, { label: string; type: 'success' | 'info' | 'danger' }> = {
  [GoodsApi.GOODS_VIEW_STATUS.ON_SHELF]: {
    label: '上架',
    type: 'success'
  },
  [GoodsApi.GOODS_VIEW_STATUS.OFF_SHELF]: {
    label: '下架',
    type: 'info'
  },
  [GoodsApi.GOODS_VIEW_STATUS.RECYCLE]: {
    label: '回收站',
    type: 'danger'
  }
}

const getStatusMeta = (status: GoodsViewStatus | number) =>
  statusMetaMap[status as GoodsViewStatus] || statusMetaMap[GoodsApi.GOODS_VIEW_STATUS.OFF_SHELF]

const heroDescription = computed(() =>
  isRecycleBin.value
    ? '集中管理已移入回收站的药品，支持恢复或彻底删除，避免误删造成数据不可追溯。'
    : '统一维护药品上架状态、分类信息和库存基础数据，保障商品数据准确。'
)

const modeHint = computed(() =>
  isRecycleBin.value
    ? '仅展示已移入回收站的药品，可恢复为下架或彻底删除。'
    : '普通列表中的删除操作会先移入回收站，避免直接硬删。'
)

const heroStats = computed(() => {
  const totalStock = tableData.value.reduce((sum, item) => sum + Number(item.stock || 0), 0)
  if (isRecycleBin.value) {
    return [
      {
        label: '回收站药品',
        value: total.value,
        helper: '筛选结果',
        tone: 'danger'
      },
      {
        label: '当前页条目',
        value: tableData.value.length,
        helper: '待处理',
        tone: 'warning'
      },
      {
        label: '可恢复药品',
        value: tableData.value.filter((item) => item.status === GoodsApi.GOODS_VIEW_STATUS.RECYCLE).length,
        helper: '当前页',
        tone: 'info'
      },
      {
        label: '当前页库存',
        value: totalStock,
        helper: '仅供核对',
        tone: 'primary'
      }
    ]
  }
  return [
    {
      label: '药品总数',
      value: total.value,
      helper: '筛选结果',
      tone: 'primary'
    },
    {
      label: '上架数量',
      value: tableData.value.filter((item) => item.status === GoodsApi.GOODS_VIEW_STATUS.ON_SHELF).length,
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

const syncViewMode = () => {
  queryParams.tabType = isRecycleBin.value ? GoodsApi.GOODS_TAB_TYPE.RECYCLE_BIN : undefined
  if (isRecycleBin.value) {
    queryParams.status = undefined
  }
}

const isActionCanceled = (error: unknown) => error === 'cancel' || error === 'close'

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

const handleViewChange = () => {
  syncViewMode()
  handleQuery()
}

const handleAdd = () => {
  formRef.value?.openDialog('create')
}

const handleEdit = (row: GoodsVO) => {
  formRef.value?.openDialog('update', row.id)
}

const handleRecycle = async (row: GoodsVO) => {
  try {
    await ElMessageBox.confirm('确定要将该药品移入回收站吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await GoodsApi.moveGoodsToRecycle(row.id!)
    ElMessage.success('已移入回收站')
    await getList()
  } catch (error) {
    if (!isActionCanceled(error)) {
      ElMessage.error(getErrorMessage(error, '移入回收站失败'))
    }
  }
}

const handleRestore = async (row: GoodsVO) => {
  try {
    await ElMessageBox.confirm('确定要将该药品恢复为下架状态吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await GoodsApi.restoreGoods(row.id!)
    ElMessage.success('已恢复为下架状态')
    await getList()
  } catch (error) {
    if (!isActionCanceled(error)) {
      ElMessage.error(getErrorMessage(error, '恢复失败'))
    }
  }
}

const handlePermanentDelete = async (row: GoodsVO) => {
  try {
    await ElMessageBox.confirm('回收站删除后将无法恢复，确定继续吗?', '提示', {
      confirmButtonText: '彻底删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await GoodsApi.deleteGoods(row.id!)
    ElMessage.success('删除成功')
    await getList()
  } catch (error) {
    if (!isActionCanceled(error)) {
      ElMessage.error(getErrorMessage(error, '删除失败'))
    }
  }
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm(`确定要导出${isRecycleBin.value ? '回收站药品' : '药品'}数据吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await GoodsApi.exportGoods(queryParams)
    ElMessage.success('导出成功')
  } catch (error) {
    if (!isActionCanceled(error)) {
      ElMessage.error(getErrorMessage(error, '导出失败'))
    }
  }
}

const handleSuccess = () => {
  getList()
}

const buildCategoryOptions = (
  list: Array<{ id?: number; name: string; children?: Array<any> }>,
  depth = 0
): Array<{ value: number; label: string }> => {
  return list.flatMap((item) => {
    const children = item.children || []
    if (children.length > 0) {
      return buildCategoryOptions(children, depth + 1)
    }
    if (!item.id) {
      return []
    }
    return [
      {
        value: item.id,
        label: `${'  '.repeat(depth)}${item.name}`
      }
    ]
  })
}

const loadCategoryOptions = async () => {
  try {
    const list = await CategoryApi.getCategoryList({})
    categoryOptions.value = buildCategoryOptions(list as Array<{ id?: number; name: string; children?: Array<any> }>)
  } catch (error) {
    categoryOptions.value = []
    ElMessage.warning('分类筛选项加载失败')
  }
}

onMounted(() => {
  syncViewMode()
  Promise.all([loadCategoryOptions(), getList()])
})
</script>

<style scoped lang="scss">
.mode-card {
  border: 1px solid var(--brand-border);
  box-shadow: var(--brand-shadow);
}

.mode-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mode-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--brand-text);
}

.mode-hint {
  margin-top: 4px;
  font-size: 13px;
  color: var(--brand-text-secondary);
}

@media (max-width: 768px) {
  .mode-switch {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
