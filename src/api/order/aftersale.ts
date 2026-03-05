import request from '@/utils/request'

export interface AftersaleVO {
  id?: number
  aftersaleNo: string
  orderNo: string
  userName: string
  type: number // 1退款/2退货退款
  amount: number
  reason: string
  status: number // 0待审核/1已同意/2已拒绝/3已完成
  images?: string[]
  createTime?: string
}

export interface AftersalePageReqVO {
  aftersaleNo?: string
  type?: number
  status?: number
  pageNo: number
  pageSize: number
}

interface AfterSaleRecord {
  id?: number
  no?: string
  orderNo?: string
  user?: { nickname?: string }
  type?: number
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

const normalizeType = (type?: number) => {
  if (type === 20 || type === 2) return 2
  return 1
}

const normalizeStatus = (status?: number) => {
  if (status === 10 || status === 0) return 0
  if (status === 20 || status === 1) return 1
  if (status === 30 || status === 2) return 2
  if (status === 40 || status === 50 || status === 3) return 3
  return 0
}

const mapAftersale = (item: AfterSaleRecord): AftersaleVO => ({
  id: item.id,
  aftersaleNo: item.no || '',
  orderNo: item.orderNo || '',
  userName: item.user?.nickname || '-',
  type: normalizeType(item.type),
  amount: toYuan(item.refundPrice),
  reason: [item.applyReason, item.applyDescription].filter(Boolean).join('；'),
  status: normalizeStatus(item.status),
  images: item.applyPicUrls || [],
  createTime: formatDateTime(item.createTime)
})

// 查询售后分页
export const getAftersalePage = async (params: AftersalePageReqVO) => {
  const data = await request.get<{ list: AfterSaleRecord[]; total: number }>({
    url: '/trade/after-sale/page',
    params: {
      no: params.aftersaleNo,
      type: params.type,
      status: params.status,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
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
