import request from '@/utils/request'

export interface DashboardOverviewVO {
  orderTotal: number
  memberTotal: number
  goodsTotal: number
  stockAlerts: number
  storesTotal: number
  pendingDelivery: number
  todaySalesAmount: number
  pendingReview: number
  pendingPrescription: number
  pendingInsurance: number
  pendingAfterSale: number
}

export interface DashboardTrendPointVO {
  date: string
  label: string
  orderCount: number
  pendingDeliveryCount: number
  salesAmount: number
}

interface RawDashboardOverviewVO {
  orderTotal?: number
  memberTotal?: number
  goodsTotal?: number
  stockAlerts?: number
  storesTotal?: number
  pendingDelivery?: number
  todaySalesAmount?: number | string
  pendingReview?: number
  pendingPrescription?: number
  pendingInsurance?: number
  pendingAfterSale?: number
}

interface RawDashboardTrendPointVO {
  date?: string
  label?: string
  orderCount?: number
  pendingDeliveryCount?: number
  salesAmount?: number | string
}

const toNumber = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return 0
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const mapOverview = (item: RawDashboardOverviewVO): DashboardOverviewVO => ({
  orderTotal: Number(item.orderTotal || 0),
  memberTotal: Number(item.memberTotal || 0),
  goodsTotal: Number(item.goodsTotal || 0),
  stockAlerts: Number(item.stockAlerts || 0),
  storesTotal: Number(item.storesTotal || 0),
  pendingDelivery: Number(item.pendingDelivery || 0),
  todaySalesAmount: Number(toNumber(item.todaySalesAmount).toFixed(2)),
  pendingReview: Number(item.pendingReview || 0),
  pendingPrescription: Number(item.pendingPrescription || 0),
  pendingInsurance: Number(item.pendingInsurance || 0),
  pendingAfterSale: Number(item.pendingAfterSale || 0)
})

const mapTrendPoint = (item: RawDashboardTrendPointVO): DashboardTrendPointVO => ({
  date: item.date || '',
  label: item.label || '',
  orderCount: Number(item.orderCount || 0),
  pendingDeliveryCount: Number(item.pendingDeliveryCount || 0),
  salesAmount: Number(toNumber(item.salesAmount).toFixed(2))
})

export const getDashboardOverview = async () => {
  const data = await request.get<RawDashboardOverviewVO>({
    url: '/trade/dashboard/overview'
  })
  return mapOverview(data || {})
}

export const getDashboardTrend = async (days = 7) => {
  const data = await request.get<RawDashboardTrendPointVO[]>({
    url: '/trade/dashboard/trend',
    params: { days }
  })
  return (data || []).map(mapTrendPoint)
}
