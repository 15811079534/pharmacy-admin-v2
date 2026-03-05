<template>
  <div class="home-dashboard" v-loading="loading">
    <section class="hero-panel">
      <div class="hero-main">
        <p class="hero-eyebrow">今日运营概览</p>
        <h1>欢迎回来，{{ displayName }}</h1>
        <p class="hero-desc">
          已接入实时业务统计，你可以从下方快速查看履约压力、库存风险和审核积压情况。
        </p>
      </div>

      <div class="hero-side">
        <div class="hero-chip">
          <span>待发货订单</span>
          <strong>{{ metrics.pendingDelivery }}</strong>
        </div>
        <div class="hero-chip">
          <span>待审核事项</span>
          <strong>{{ metrics.pendingReview }}</strong>
        </div>
        <div class="hero-chip hero-chip-compact">
          <span>药品 / 门店</span>
          <strong>{{ metrics.goodsTotal }} / {{ metrics.storesTotal }}</strong>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <article v-for="item in kpiCards" :key="item.label" class="kpi-card">
        <div class="kpi-head">
          <div class="kpi-icon" :class="item.tone">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <span class="kpi-trend" :class="item.trendType">{{ item.trend }}</span>
        </div>
        <p class="kpi-value">{{ item.value }}</p>
        <p class="kpi-label">{{ item.label }}</p>
      </article>
    </section>

    <section class="ops-strip">
      <article class="ops-item">
        <span>在架药品</span>
        <strong>{{ metrics.goodsTotal }}</strong>
      </article>
      <article class="ops-item">
        <span>药房门店</span>
        <strong>{{ metrics.storesTotal }}</strong>
      </article>
      <article class="ops-item">
        <span>处方待审</span>
        <strong>{{ metrics.pendingPrescription }}</strong>
      </article>
      <article class="ops-item">
        <span>医保待处理</span>
        <strong>{{ metrics.pendingInsurance }}</strong>
      </article>
      <article class="ops-item">
        <span>售后待处理</span>
        <strong>{{ metrics.pendingAfterSale }}</strong>
      </article>
    </section>

    <section class="trend-grid">
      <el-card class="trend-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>近 7 天订单量与待发货趋势</h3>
            <div class="trend-head-right">
              <span>{{ trendRangeText }}</span>
              <span class="trend-badge" :class="orderRateClass">{{ orderDayRateText }}</span>
            </div>
          </div>
        </template>
        <TrendChart :labels="trend.labels" :series="volumeTrendSeries" />
      </el-card>

      <el-card class="trend-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>近 7 天销售额趋势</h3>
            <div class="trend-head-right">
              <span>单位：元</span>
              <span class="trend-badge" :class="salesRateClass">{{ salesDayRateText }}</span>
            </div>
          </div>
        </template>
        <TrendChart :labels="trend.labels" :series="salesTrendSeries" unit="currency" />
      </el-card>
    </section>

    <section class="content-grid">
      <el-card class="quick-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>快捷操作</h3>
            <span>高频功能入口</span>
          </div>
        </template>

        <div class="quick-grid">
          <button
            v-for="item in quickActions"
            :key="item.title"
            class="quick-item"
            type="button"
            @click="go(item.path)"
          >
            <div class="icon-wrap" :class="item.tone">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="text-wrap">
              <p class="title">{{ item.title }}</p>
              <p class="desc">{{ item.desc }}</p>
            </div>
          </button>
        </div>
      </el-card>

      <el-card class="todo-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>业务提醒</h3>
            <span>今日重点事项</span>
          </div>
        </template>

        <ul class="todo-list">
          <li>
            <span class="tag high">紧急</span>
            <div class="todo-content">
              <p class="todo-title">待发货订单 {{ metrics.pendingDelivery }} 单</p>
              <p class="todo-desc">建议优先处理超 24 小时未发货订单，降低催单风险。</p>
            </div>
          </li>
          <li>
            <span class="tag medium">关注</span>
            <div class="todo-content">
              <p class="todo-title">库存预警药品 {{ metrics.stockAlerts }} 项</p>
              <p class="todo-desc">建议补货缺货或低库存药品，减少下单后缺货场景。</p>
            </div>
          </li>
          <li>
            <span class="tag low">常规</span>
            <div class="todo-content">
              <p class="todo-title">待审核事项 {{ metrics.pendingReview }} 条</p>
              <p class="todo-desc">包含处方、医保与售后审核任务，建议按时效分批处理。</p>
              <div class="todo-breakdown">
                <span>处方 {{ metrics.pendingPrescription }}</span>
                <span>医保 {{ metrics.pendingInsurance }}</span>
                <span>售后 {{ metrics.pendingAfterSale }}</span>
              </div>
            </div>
          </li>
        </ul>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShoppingCart,
  Money,
  User,
  Box,
  Goods,
  Tickets,
  Van,
  Bell,
  FirstAidKit
} from '@element-plus/icons-vue'
import TrendChart from '@/components/TrendChart.vue'
import { useUserStore } from '@/stores/user'
import { getDashboardOverview, getDashboardTrend } from '@/api/dashboard'

const router = useRouter()
const userStore = useUserStore()

const displayName = computed(() => userStore.userInfo?.nickname || '管理员')
const loading = ref(false)

const metrics = reactive({
  orderTotal: 0,
  pendingDelivery: 0,
  orderAmountPage: 0,
  memberTotal: 0,
  goodsTotal: 0,
  stockAlerts: 0,
  storesTotal: 0,
  pendingReview: 0,
  pendingPrescription: 0,
  pendingInsurance: 0,
  pendingAfterSale: 0
})

const trend = reactive({
  labels: [] as string[],
  orderCounts: [] as number[],
  salesAmounts: [] as number[],
  pendingDeliveryCounts: [] as number[]
})

const kpiCards = computed(() => [
  {
    label: '订单总量',
    value: metrics.orderTotal,
    trend: '实时',
    trendType: 'up',
    icon: ShoppingCart,
    tone: 'blue'
  },
  {
    label: '今日销售额',
    value: `¥${metrics.orderAmountPage.toFixed(2)}`,
    trend: '实时',
    trendType: 'up',
    icon: Money,
    tone: 'green'
  },
  {
    label: '会员总数',
    value: metrics.memberTotal,
    trend: '实时',
    trendType: 'up',
    icon: User,
    tone: 'teal'
  },
  {
    label: '库存预警',
    value: metrics.stockAlerts,
    trend: '监控',
    trendType: 'down',
    icon: Box,
    tone: 'orange'
  }
])

const volumeTrendSeries = computed(() => [
  {
    name: '订单量',
    color: '#0891b2',
    data: trend.orderCounts
  },
  {
    name: '待发货',
    color: '#dc2626',
    data: trend.pendingDeliveryCounts
  }
])

const salesTrendSeries = computed(() => [
  {
    name: '销售额',
    color: '#059669',
    data: trend.salesAmounts
  }
])

const trendRangeText = computed(() => {
  if (!trend.labels.length) {
    return '近 7 天'
  }
  return `${trend.labels[0]} - ${trend.labels[trend.labels.length - 1]}`
})

const getRate = (current: number, previous: number): number | null => {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

const orderDayRate = computed(() => {
  const list = trend.orderCounts
  if (list.length < 2) return null
  const current = list[list.length - 1] ?? 0
  const previous = list[list.length - 2] ?? 0
  return getRate(current, previous)
})

const salesDayRate = computed(() => {
  const list = trend.salesAmounts
  if (list.length < 2) return null
  const current = list[list.length - 1] ?? 0
  const previous = list[list.length - 2] ?? 0
  return getRate(current, previous)
})

const formatRateText = (label: string, rate: number | null) => {
  if (rate === null) return `${label} 暂无对比`
  const prefix = rate >= 0 ? '+' : ''
  return `${label} ${prefix}${rate.toFixed(1)}%`
}

const orderDayRateText = computed(() => formatRateText('较昨日', orderDayRate.value))
const salesDayRateText = computed(() => formatRateText('较昨日', salesDayRate.value))

const orderRateClass = computed(() => {
  if (orderDayRate.value === null) return 'neutral'
  return orderDayRate.value >= 0 ? 'up' : 'down'
})

const salesRateClass = computed(() => {
  if (salesDayRate.value === null) return 'neutral'
  return salesDayRate.value >= 0 ? 'up' : 'down'
})

const quickActions = [
  {
    title: '药品信息',
    desc: '维护药品档案与上下架',
    path: '/goods/goods',
    icon: Goods,
    tone: 'blue'
  },
  {
    title: '库存管理',
    desc: '处理入库、出库与预警',
    path: '/goods/stock',
    icon: Box,
    tone: 'orange'
  },
  {
    title: '订单列表',
    desc: '查看订单与发货进度',
    path: '/order/order',
    icon: Tickets,
    tone: 'teal'
  },
  {
    title: '物流管理',
    desc: '追踪物流状态与异常',
    path: '/order/logistics',
    icon: Van,
    tone: 'green'
  },
  {
    title: '医保管理',
    desc: '核对医保订单与结算',
    path: '/pharmacy/insurance',
    icon: FirstAidKit,
    tone: 'purple'
  },
  {
    title: '公告管理',
    desc: '发布营销通知与活动',
    path: '/marketing/notice',
    icon: Bell,
    tone: 'blue'
  }
]

const go = (path: string) => {
  router.push(path)
}

const loadMetrics = async () => {
  try {
    const overview = await getDashboardOverview()
    metrics.orderTotal = Number(overview.orderTotal || 0)
    metrics.memberTotal = Number(overview.memberTotal || 0)
    metrics.goodsTotal = Number(overview.goodsTotal || 0)
    metrics.stockAlerts = Number(overview.stockAlerts || 0)
    metrics.storesTotal = Number(overview.storesTotal || 0)
    metrics.pendingDelivery = Number(overview.pendingDelivery || 0)
    metrics.pendingReview = Number(overview.pendingReview || 0)
    metrics.pendingPrescription = Number(overview.pendingPrescription || 0)
    metrics.pendingInsurance = Number(overview.pendingInsurance || 0)
    metrics.pendingAfterSale = Number(overview.pendingAfterSale || 0)
    metrics.orderAmountPage = Number(overview.todaySalesAmount || 0)
  } catch (error) {
    ElMessage.warning('统计数据加载失败，请稍后重试')
  }
}

const loadTrendData = async () => {
  try {
    const points = await getDashboardTrend(7)
    trend.labels = points.map((item) => item.label)
    trend.orderCounts = points.map((item) => Number(item.orderCount || 0))
    trend.salesAmounts = points.map((item) => Number(item.salesAmount || 0))
    trend.pendingDeliveryCounts = points.map((item) => Number(item.pendingDeliveryCount || 0))
  } catch (error) {
    ElMessage.warning('趋势图数据加载失败，请稍后重试')
  }
}

const loadDashboard = async () => {
  loading.value = true
  try {
    await Promise.all([loadMetrics(), loadTrendData()])
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<style scoped lang="scss">
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 26px;
  border-radius: 22px;
  color: #eaffff;
  background:
    radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.34), transparent 30%),
    linear-gradient(125deg, #0c566d 0%, #0d4f66 48%, #0a3f57 100%);
  box-shadow: 0 18px 36px rgba(11, 69, 92, 0.36);
}

.hero-main {
  max-width: 620px;
}

.hero-eyebrow {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 12px;
  background: rgba(183, 241, 255, 0.16);
  border: 1px solid rgba(188, 240, 252, 0.28);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-panel h1 {
  margin-top: 12px;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.25;
}

.hero-desc {
  margin-top: 10px;
  color: rgba(225, 250, 255, 0.86);
  line-height: 1.7;
}

.hero-side {
  min-width: 210px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-chip {
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(189, 241, 252, 0.24);
  background: rgba(173, 237, 250, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;

  strong {
    font-size: 22px;
    font-weight: 800;
    color: #bcfdff;
  }
}

.hero-chip.hero-chip-compact strong {
  font-size: 18px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  border-radius: 18px;
  padding: 16px;
  border: 1px solid #d4edf3;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 24px rgba(14, 116, 144, 0.08);
}

.kpi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.kpi-icon.blue {
  background: rgba(8, 145, 178, 0.14);
  color: #0f8196;
}

.kpi-icon.green {
  background: rgba(16, 185, 129, 0.14);
  color: #0a8f66;
}

.kpi-icon.teal {
  background: rgba(20, 184, 166, 0.14);
  color: #0e8d80;
}

.kpi-icon.orange {
  background: rgba(249, 115, 22, 0.16);
  color: #d96708;
}

.kpi-trend {
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 700;
}

.kpi-trend.up {
  color: #059669;
  background: rgba(16, 185, 129, 0.14);
}

.kpi-trend.down {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.14);
}

.kpi-value {
  margin-top: 14px;
  font-size: 30px;
  font-weight: 800;
  color: #155166;
}

.kpi-label {
  margin-top: 4px;
  color: #6b97a8;
  font-size: 13px;
}

.ops-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.ops-item {
  border: 1px solid #d9edf3;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(244, 251, 255, 0.88));
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  span {
    color: #6e95a5;
    font-size: 12px;
  }

  strong {
    color: #14506a;
    font-size: 22px;
    line-height: 1;
  }
}

.trend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.content-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1.5fr 1fr;
}

.quick-card,
.todo-card,
.trend-card {
  border-radius: 20px;
  border: 1px solid #d4edf3;
  background: rgba(255, 255, 255, 0.88);

  :deep(.el-card__header) {
    border-bottom: 1px solid #e5f4f7;
    padding: 16px 18px;
  }

  :deep(.el-card__body) {
    padding: 16px 18px 18px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;

  h3 {
    font-size: 18px;
    color: #164e63;
  }

  span {
    font-size: 12px;
    color: #78a3b3;
  }
}

.trend-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-badge {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

.trend-badge.up {
  color: #047857;
  background: rgba(16, 185, 129, 0.14);
}

.trend-badge.down {
  color: #be123c;
  background: rgba(244, 63, 94, 0.14);
}

.trend-badge.neutral {
  color: #5f8ea2;
  background: rgba(148, 163, 184, 0.14);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-item {
  border: 1px solid #dbf0f4;
  background: #f8fdff;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 220ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #8fd2dd;
    box-shadow: 0 10px 18px rgba(8, 145, 178, 0.12);
  }
}

.icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.icon-wrap.blue {
  background: rgba(8, 145, 178, 0.12);
  color: #0f8399;
}

.icon-wrap.teal {
  background: rgba(20, 184, 166, 0.14);
  color: #0b8a80;
}

.icon-wrap.green {
  background: rgba(16, 185, 129, 0.15);
  color: #07885f;
}

.icon-wrap.orange {
  background: rgba(249, 115, 22, 0.16);
  color: #d26b0b;
}

.icon-wrap.purple {
  background: rgba(14, 165, 233, 0.14);
  color: #0f83b0;
}

.text-wrap {
  min-width: 0;
}

.text-wrap .title {
  font-weight: 700;
  color: #1a556a;
}

.text-wrap .desc {
  margin-top: 2px;
  font-size: 12px;
  color: #7b9faf;
}

.todo-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.todo-list li {
  border: 1px solid #e3f3f7;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #fafeff;
}

.tag {
  min-width: 42px;
  text-align: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

.tag.high {
  color: #be123c;
  background: rgba(244, 63, 94, 0.12);
}

.tag.medium {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.14);
}

.tag.low {
  color: #0369a1;
  background: rgba(14, 165, 233, 0.14);
}

.todo-content {
  min-width: 0;
}

.todo-title {
  font-weight: 700;
  color: #1a556a;
}

.todo-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #739bae;
}

.todo-breakdown {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    font-size: 11px;
    border-radius: 999px;
    padding: 2px 8px;
    color: #0f5f7a;
    border: 1px solid #cfe7ee;
    background: #f0fafc;
  }
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ops-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trend-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-panel {
    flex-direction: column;
    padding: 18px;
  }

  .hero-side {
    min-width: 0;
    width: 100%;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .ops-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-value {
    font-size: 26px;
  }
}
</style>
