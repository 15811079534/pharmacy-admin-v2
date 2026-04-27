import request from '@/utils/request'

export interface AftersaleVO {
  id?: number
  aftersaleNo: string
  orderNo: string
  userName: string
  type: number // 10售中退款/20售后退款
  way: number // 10仅退款/20退货退款
  amount: number
  reason: string
  status: number // 10申请中/20卖家通过/30待卖家收货/40等待平台退款/50退款成功/61买家取消/62卖家拒绝/63卖家拒收
  images?: string[]
  createTime?: string
}

export interface AftersalePageReqVO {
  aftersaleNo?: string
  way?: number
  status?: number
  pageNo: number
  pageSize: number
}

export const AFTERSALE_WAY_OPTIONS = [
  { label: '仅退款', value: 10 },
  { label: '退货退款', value: 20 }
] as const

export const AFTERSALE_STATUS_OPTIONS = [
  { label: '申请中', value: 10 },
  { label: '卖家通过', value: 20 },
  { label: '待卖家收货', value: 30 },
  { label: '等待平台退款', value: 40 },
  { label: '已退款', value: 50 },
  { label: '买家取消', value: 61 },
  { label: '卖家拒绝', value: 62 },
  { label: '卖家拒收', value: 63 }
] as const

const AFTERSALE_STATUS_META: Record<number, { label: string; tagType: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  10: { label: '申请中', tagType: 'warning' },
  20: { label: '卖家通过', tagType: 'primary' },
  30: { label: '待卖家收货', tagType: 'warning' },
  40: { label: '等待平台退款', tagType: 'primary' },
  50: { label: '已退款', tagType: 'success' },
  61: { label: '买家取消', tagType: 'info' },
  62: { label: '卖家拒绝', tagType: 'danger' },
  63: { label: '卖家拒收', tagType: 'danger' }
}

const AFTERSALE_WAY_META: Record<number, { label: string; tagType: 'warning' | 'danger' }> = {
  10: { label: '仅退款', tagType: 'warning' },
  20: { label: '退货退款', tagType: 'danger' }
}

export const getAftersaleStatusMeta = (status?: number) => {
  return AFTERSALE_STATUS_META[status || 0] || { label: `未知状态(${status ?? '-'})`, tagType: 'info' as const }
}

export const getAftersaleWayMeta = (way?: number) => {
  return AFTERSALE_WAY_META[way || 0] || { label: `未知方式(${way ?? '-'})`, tagType: 'info' as const }
}

interface AfterSaleRecord {
  id?: number
  no?: string
  orderNo?: string
  user?: { nickname?: string }
  type?: number
  way?: number
  refundPrice?: number
  applyReason?: string
  applyDescription?: string
  status?: number
  applyPicUrls?: string[]
  createTime?: string | number
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

const fetchAftersalePage = (params: {
  aftersaleNo?: string
  way?: number
  status?: number
  pageNo: number
  pageSize: number
}) => {
  return request.get<{ list: AfterSaleRecord[]; total: number }>({
    url: '/trade/after-sale/page',
    params: {
      no: params.aftersaleNo,
      way: params.way,
      status: params.status,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
}

const mapAftersale = (item: AfterSaleRecord): AftersaleVO => ({
  id: item.id,
  aftersaleNo: item.no || '',
  orderNo: item.orderNo || '',
  userName: item.user?.nickname || '-',
  type: item.type || 10,
  way: item.way || 10,
  amount: toYuan(item.refundPrice),
  reason: [item.applyReason, item.applyDescription].filter(Boolean).join('；'),
  status: item.status || 10,
  images: item.applyPicUrls || [],
  createTime: formatDateTime(item.createTime)
})

// 查询售后分页
export const getAftersalePage = async (params: AftersalePageReqVO) => {
  const data = await fetchAftersalePage({
    aftersaleNo: params.aftersaleNo,
    way: params.way,
    status: params.status,
    pageNo: params.pageNo,
    pageSize: params.pageSize
  })

  return {
    list: (data.list || []).map(mapAftersale),
    total: data.total || 0
  }
}

// 查询售后详情
export const getAftersale = async (id: number) => {
  const data = await request.get<AfterSaleRecord>({
    url: '/trade/after-sale/get-detail',
    params: { id }
  })
  return mapAftersale(data || {})
}

// 同意售后
export const approveAftersale = (id: number) => {
  return request.put({
    url: '/trade/after-sale/agree',
    params: { id }
  })
}

// 拒绝售后
export const rejectAftersale = (id: number, reason: string) => {
  return request.put({
    url: '/trade/after-sale/disagree',
    data: { id, auditReason: reason }
  })
}
