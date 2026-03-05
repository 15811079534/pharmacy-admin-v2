import request from '@/utils/request'

export interface LogisticsVO {
  id?: number
  logisticsId?: number
  orderNo: string
  trackingNo: string
  company: string
  companyName?: string
  receiver: string
  phone: string
  address: string
  status: number
  createTime?: string
}

export interface LogisticsPageReqVO {
  trackingNo?: string
  company?: string
  status?: number
  pageNo: number
  pageSize: number
}

export interface LogisticsTrackVO {
  time: string
  status: string
  location?: string
}

interface TradeOrder {
  id?: number
  no?: string
  logisticsId?: number
  logisticsNo?: string
  receiverName?: string
  receiverMobile?: string
  receiverAreaName?: string
  receiverDetailAddress?: string
  status?: number
  createTime?: string | number
  deliveryTime?: string | number
  receiveTime?: string | number
}

interface ExpressSimpleVO {
  id: number
  name: string
}

let expressMapCache: Record<number, string> | null = null
let expressMapPromise: Promise<Record<number, string>> | null = null

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

const mapOrderStatusToLogisticsStatus = (
  orderStatus?: number,
  deliveryTime?: string | number,
  receiveTime?: string | number
) => {
  if (!deliveryTime) return 0
  if (receiveTime) return 3
  if (orderStatus === 2 || orderStatus === 20) return 2
  return 1
}

const loadExpressMap = async () => {
  if (expressMapCache) {
    return expressMapCache
  }
  if (!expressMapPromise) {
    expressMapPromise = request
      .get<ExpressSimpleVO[]>({ url: '/trade/delivery/express/list-all-simple' })
      .then((list) => {
        const map: Record<number, string> = {}
        ;(list || []).forEach((item) => {
          map[item.id] = item.name
        })
        expressMapCache = map
        return map
      })
      .finally(() => {
        expressMapPromise = null
      })
  }
  return expressMapPromise
}

export const getExpressCompanyList = () => {
  return request.get<ExpressSimpleVO[]>({
    url: '/trade/delivery/express/list-all-simple'
  })
}

const mapLogistics = (item: TradeOrder, expressMap: Record<number, string>): LogisticsVO => {
  const logisticsId = item.logisticsId || undefined
  const companyName = logisticsId ? expressMap[logisticsId] : ''
  return {
    id: item.id,
    logisticsId,
    orderNo: item.no || '',
    trackingNo: item.logisticsNo || '',
    company: logisticsId ? String(logisticsId) : '',
    companyName: companyName || '',
    receiver: item.receiverName || '',
    phone: item.receiverMobile || '',
    address: `${item.receiverAreaName || ''} ${item.receiverDetailAddress || ''}`.trim(),
    status: mapOrderStatusToLogisticsStatus(item.status, item.deliveryTime, item.receiveTime),
    createTime: formatDateTime(item.deliveryTime || item.createTime)
  }
}

// 查询物流分页
export const getLogisticsPage = async (params: LogisticsPageReqVO) => {
  const expressMap = await loadExpressMap()
  const logisticsId = params.company ? Number(params.company) : undefined
  const useLocalFilter = Boolean(params.trackingNo || params.status !== undefined)
  const pageData = await request.get<{ list: TradeOrder[]; total: number }>({
    url: '/trade/order/page',
    params: {
      logisticsId: Number.isFinite(logisticsId) ? logisticsId : undefined,
      pageNo: useLocalFilter ? 1 : params.pageNo,
      pageSize: useLocalFilter ? 500 : params.pageSize
    }
  })
  const mapped = (pageData.list || []).map((item) => mapLogistics(item, expressMap))
  const filtered = mapped.filter((item) => {
    const trackingOk = params.trackingNo ? item.trackingNo.includes(params.trackingNo) : true
    const statusOk = params.status === undefined ? true : item.status === params.status
    return trackingOk && statusOk
  })

  if (!useLocalFilter) {
    return { list: filtered, total: pageData.total || 0 }
  }

  const start = (params.pageNo - 1) * params.pageSize
  return {
    list: filtered.slice(start, start + params.pageSize),
    total: filtered.length
  }
}

// 查询物流详情
export const getLogistics = async (id: number) => {
  const [expressMap, data] = await Promise.all([
    loadExpressMap(),
    request.get<TradeOrder>({
      url: '/trade/order/get-detail',
      params: { id }
    })
  ])
  return mapLogistics(data || {}, expressMap)
}

// 更新物流信息（复用订单发货接口）
export const updateLogistics = async (data: {
  id: number
  logisticsId?: number
  trackingNo?: string
  company?: string
  status?: number
}) => {
  void data.status
  let logisticsId = data.logisticsId
  if (!logisticsId && data.company) {
    const parsedId = Number(data.company)
    if (Number.isFinite(parsedId)) {
      logisticsId = parsedId
    }
  }
  if (!logisticsId) {
    throw new Error('请选择物流公司')
  }
  return request.put({
    url: '/trade/order/delivery',
    data: {
      id: data.id,
      logisticsId,
      logisticsNo: data.trackingNo
    }
  })
}

// 物流跟踪
export const trackLogistics = async (id: number) => {
  const data = await request.get<any[]>({
    url: '/trade/order/get-express-track-list',
    params: { id }
  })
  return (data || []).map((item) => ({
    time: formatDateTime(item?.time || item?.acceptTime || item?.createTime),
    status:
      item?.content ||
      item?.statusDesc ||
      item?.acceptStation ||
      item?.status ||
      item?.message ||
      '物流更新',
    location: item?.location || item?.acceptAddress || item?.context
  }))
}
