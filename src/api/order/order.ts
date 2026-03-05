import request from '@/utils/request'

export interface OrderVO {
  id?: number
  orderNo: string
  logisticsId?: number
  trackingNo?: string
  company?: string
  userName: string
  totalAmount: number
  status: number
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
    wallet: '钱包'
  }
  return map[code] || code
}

const normalizeOrderStatus = (status?: number) => {
  if (status === 0) return 0
  if (status === 1 || status === 10) return 1
  if (status === 2 || status === 20) return 2
  if (status === 3 || status === 30) return 3
  if (status === 4 || status === 40 || status === 50) return 4
  return 0
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
  status: normalizeOrderStatus(item.status),
  payType: payTypeLabel(item.payChannelCode),
  createTime: formatDateTime(item.createTime),
  items: (item.items || []).map(mapOrderItem)
})

// 查询订单分页
export const getOrderPage = async (params: OrderPageReqVO) => {
  const data = await request.get<{ list: TradeOrder[]; total: number }>({
    url: '/trade/order/page',
    params: {
      no: params.orderNo,
      logisticsId: params.logisticsId,
      status: params.status,
      createTime: params.createTime,
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
  return request.download({
    url: '/trade/order/export-excel',
    params: {
      no: params.orderNo,
      logisticsId: params.logisticsId,
      status: params.status,
      createTime: params.createTime,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
}
