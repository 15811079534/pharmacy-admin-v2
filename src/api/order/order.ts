import request from '@/utils/request'
import { normalizeDateRangeToDayBounds } from '@/utils/query'

export interface OrderVO {
  id?: number
  orderNo: string
  logisticsId?: number
  trackingNo?: string
  company?: string
  userName: string
  totalAmount: number
  status: number // 0待支付/10待发货/20已发货/30已完成/40已取消
  payType: string
  createTime?: string
  items?: OrderItemVO[]
}

export interface OrderItemVO {
  goodsName: string
  price: number
  quantity: number
  amount: number
}

export interface OrderPageReqVO {
  orderNo?: string
  logisticsId?: number
  status?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

export interface ExpressCompanyVO {
  id: number
  code?: string
  name: string
}

export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: 0 },
  { label: '待发货', value: 10 },
  { label: '已发货', value: 20 },
  { label: '已完成', value: 30 },
  { label: '已取消', value: 40 }
] as const

const ORDER_STATUS_META: Record<number, { label: string; tagType: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { label: '待支付', tagType: 'warning' },
  10: { label: '待发货', tagType: 'primary' },
  20: { label: '已发货', tagType: 'info' },
  30: { label: '已完成', tagType: 'success' },
  40: { label: '已取消', tagType: 'danger' }
}

export const getOrderStatusMeta = (status?: number) => {
  return ORDER_STATUS_META[status || 0] || { label: `未知状态(${status ?? '-'})`, tagType: 'info' as const }
}

interface TradeOrderItem {
  spuName?: string
  price?: number
  count?: number
  payPrice?: number
}

interface TradeOrder {
  id?: number
  no?: string
  logisticsId?: number
  logisticsNo?: string
  user?: { nickname?: string }
  payPrice?: number
  status?: number
  payChannelCode?: string
  createTime?: string | number
  items?: TradeOrderItem[]
}

const toYuan = (amount?: number) => Number(((amount || 0) / 100).toFixed(2))

const formatDateTime = (value?: string | number) => {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mi = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

const payTypeLabel = (code?: string) => {
  if (!code) return '-'
  const map: Record<string, string> = {
    wx_lite: '微信小程序',
    wx_pub: '微信公众号',
    alipay_pc: '支付宝',
    wallet: '钱包',
    mock: '微信小程序'
  }
  return map[code] || code
}

const mapOrderItem = (item: TradeOrderItem): OrderItemVO => ({
  goodsName: item.spuName || '-',
  price: toYuan(item.price),
  quantity: item.count || 0,
  amount: toYuan(item.payPrice)
})

const mapOrder = (item: TradeOrder): OrderVO => ({
  id: item.id,
  orderNo: item.no || '',
  logisticsId: item.logisticsId,
  trackingNo: item.logisticsNo || '',
  userName: item.user?.nickname || '-',
  totalAmount: toYuan(item.payPrice),
  status: item.status || 0,
  payType: payTypeLabel(item.payChannelCode),
  createTime: formatDateTime(item.createTime),
  items: (item.items || []).map(mapOrderItem)
})

// 查询订单分页
export const getOrderPage = async (params: OrderPageReqVO) => {
  const createTime = normalizeDateRangeToDayBounds(params.createTime)
  const data = await request.get<{ list: TradeOrder[]; total: number }>({
    url: '/trade/order/page',
    params: {
      no: params.orderNo,
      logisticsId: params.logisticsId,
      status: params.status,
      createTime,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
  return {
    list: (data.list || []).map(mapOrder),
    total: data.total || 0
  }
}

// 查询订单详情
export const getOrder = async (id: number) => {
  const data = await request.get<TradeOrder>({
    url: '/trade/order/get-detail',
    params: { id }
  })
  return mapOrder(data || {})
}

// 发货
export const deliverOrder = (data: { id: number; logisticsId: number; trackingNo?: string }) => {
  return request.put({
    url: '/trade/order/delivery',
    data: {
      id: data.id,
      logisticsId: data.logisticsId,
      logisticsNo: data.trackingNo
    }
  })
}

// 物流公司（发货用）
export const getExpressCompanyList = () => {
  return request.get<ExpressCompanyVO[]>({
    url: '/trade/delivery/express/list-all-simple'
  })
}

export const cancelOrder = (id: number, reason: string) => {
  return request.put({
    url: '/trade/order/cancel',
    params: { id, reason }
  })
}

export const exportOrder = (params: OrderPageReqVO) => {
  const createTime = normalizeDateRangeToDayBounds(params.createTime)
  return request.download({
    url: '/trade/order/export-excel',
    params: {
      no: params.orderNo,
      logisticsId: params.logisticsId,
      status: params.status,
      createTime,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
}
