<template>
  <div class="app-container">
    <PageHero
      title="库存调度中心"
      description="实时监控药品库存健康度，快速执行入库与出库操作，减少缺货风险。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="药品名称">
          <el-input v-model="queryParams.goodsName" placeholder="请输入药品名称" clearable />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="queryParams.stockStatus" placeholder="请选择库存状态" clearable>
            <el-option label="充足" :value="0" />
            <el-option label="不足" :value="1" />
            <el-option label="缺货" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="() => handleReset(() => queryFormRef.resetFields())">重置</el-button>
          <el-button type="success" @click="handleInbound">入库</el-button>
          <el-button type="warning" @click="handleOutbound">出库</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <InboundForm ref="inboundFormRef" @success="handleSuccess" />
    <OutboundForm ref="outboundFormRef" @success="handleSuccess" />

    <el-dialog v-model="detailVisible" title="库存详情" width="600px">
      <el-descriptions :column="2" border v-loading="detailLoading">
        <el-descriptions-item label="药品名称">{{ detailData.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">
          <el-tag :type="getStockTagType(detailData.stock, detailData.alertStock)">
            {{ detailData.stock }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警库存">{{ detailData.alertStock }}</el-descriptions-item>
        <el-descriptions-item label="累计入库">{{ detailData.inboundTotal }}</el-descriptions-item>
        <el-descriptions-item label="累计出库">{{ detailData.outboundTotal }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="goodsName" label="药品名称" />
        <el-table-column prop="stock" label="当前库存" width="120">
          <template #default="{ row }">
            <el-tag :type="getStockTagType(row.stock, row.alertStock)">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alertStock" label="预警库存" width="120" />
        <el-table-column prop="inboundTotal" label="累计入库" width="120" />
        <el-table-column prop="outboundTotal" label="累计出库" width="120" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="success" @click="handleInboundSingle(row)">入库</el-button>
            <el-button link type="warning" @click="handleOutboundSingle(row)">出库</el-button>
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
import * as StockApi from '@/api/goods/stock'
import type { StockPageReqVO, StockVO } from '@/api/goods/stock'
import PageHero from '@/components/PageHero.vue'
import InboundForm from './InboundForm.vue'
import OutboundForm from './OutboundForm.vue'

const queryFormRef = ref()
const inboundFormRef = ref()
const outboundFormRef = ref()

const queryParams = reactive<StockPageReqVO>({
  goodsName: '',
  stockStatus: undefined,
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: StockApi.getStockPage,
  queryParams
})

const heroStats = computed(() => {
  const shortage = tableData.value.filter((item) => item.stock > 0 && item.stock <= item.alertStock).length
  const outOfStock = tableData.value.filter((item) => item.stock === 0).length
  const stockTotal = tableData.value.reduce((sum, item) => sum + Number(item.stock || 0), 0)

  return [
    {
      label: '库存条目',
      value: total.value,
      helper: '筛选结果',
      tone: 'primary'
    },
    {
      label: '库存不足',
      value: shortage,
      helper: '当前页',
      tone: 'warning'
    },
    {
      label: '缺货药品',
      value: outOfStock,
      helper: '当前页',
      tone: 'danger'
    },
    {
      label: '当前库存总量',
      value: stockTotal,
      helper: '动态汇总',
      tone: 'success'
    }
  ]
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<StockVO>({
  goodsId: 0,
  goodsName: '',
  stock: 0,
  alertStock: 0,
  inboundTotal: 0,
  outboundTotal: 0
})

const getStockTagType = (stock: number, alertStock: number) => {
  if (stock === 0) return 'danger'
  if (stock <= alertStock) return 'warning'
  return 'success'
}

const handleInbound = () => {
  inboundFormRef.value?.open()
}

const handleOutbound = () => {
  outboundFormRef.value?.open()
}

const handleDetail = async (row: StockVO) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    detailData.value = await StockApi.getStock(row.id!)
  } catch (error) {
    ElMessage.error('获取库存详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleInboundSingle = (row: StockVO) => {
  inboundFormRef.value?.open(row.goodsId)
}

const handleOutboundSingle = (row: StockVO) => {
  outboundFormRef.value?.open(row.goodsId)
}

const handleSuccess = () => {
  getList()
}

onMounted(() => {
  getList()
})
</script>
