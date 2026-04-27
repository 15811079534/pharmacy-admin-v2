import request from '@/utils/request'

export interface StoreVO {
  id?: number
  name: string
  address: string
  longitude?: number
  latitude?: number
  phone: string
  businessHours: string
  deliveryRadius: number
  picUrl?: string
  status: number
  createTime?: string
}

export interface StorePageReqVO {
  name?: string
  status?: number
  pageNo: number
  pageSize: number
}

export const STORE_STATUS_OPTIONS = [
  { label: '营业中', value: 1 },
  { label: '休息中', value: 0 }
] as const

const STORE_STATUS_META: Record<number, { label: string; tagType: 'success' | 'info' }> = {
  1: { label: '营业中', tagType: 'success' },
  0: { label: '休息中', tagType: 'info' }
}

export const getStoreStatusMeta = (status?: number) => {
  return STORE_STATUS_META[status ?? 0] || { label: `未知状态(${status ?? '-'})`, tagType: 'info' as const }
}

interface PharmacyStoreRecord {
  id?: number
  name?: string
  address?: string
  longitude?: number
  latitude?: number
  phone?: string
  openTime?: string
  closeTime?: string
  deliveryRadius?: number
  picUrl?: string
  status?: number
  createTime?: string | number
}

const DEFAULT_LONGITUDE = 116.397128
const DEFAULT_LATITUDE = 39.916527

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

const mapStore = (item: PharmacyStoreRecord): StoreVO => ({
  id: item.id,
  name: item.name || '',
  address: item.address || '',
  longitude: item.longitude,
  latitude: item.latitude,
  phone: item.phone || '',
  businessHours: [item.openTime, item.closeTime].filter(Boolean).join('-'),
  deliveryRadius: Number(item.deliveryRadius || 0),
  picUrl: item.picUrl || '',
  status: Number(item.status ?? 0),
  createTime: formatDateTime(item.createTime)
})

const parseBusinessHours = (hours: string) => {
  const [openTime, closeTime] = (hours || '').split('-').map((s) => s.trim())
  return { openTime, closeTime }
}

const toBackendPayload = (data: StoreVO) => {
  const { openTime, closeTime } = parseBusinessHours(data.businessHours)
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    longitude: data.longitude ?? DEFAULT_LONGITUDE,
    latitude: data.latitude ?? DEFAULT_LATITUDE,
    phone: data.phone,
    openTime: openTime || undefined,
    closeTime: closeTime || undefined,
    deliveryRadius: data.deliveryRadius,
    status: data.status,
    picUrl: data.picUrl || undefined
  }
}

// 查询门店分页
export const getStorePage = async (params: StorePageReqVO) => {
  // 当前线上后端仅提供 list 接口，这里直接走前端分页，避免每次进入页面先触发 404。
  const list = await request.get<PharmacyStoreRecord[]>({
    url: '/trade/pharmacy-store/list'
  })
  const mapped = (list || []).map(mapStore)
  const filtered = mapped.filter((item) => {
    const nameOk = params.name ? item.name.includes(params.name) : true
    const statusOk = params.status === undefined ? true : item.status === params.status
    return nameOk && statusOk
  })
  const start = (params.pageNo - 1) * params.pageSize

  return {
    list: filtered.slice(start, start + params.pageSize),
    total: filtered.length
  }
}

// 查询门店详情
export const getStore = async (id: number) => {
  const data = await request.get<PharmacyStoreRecord>({
    url: '/trade/pharmacy-store/get',
    params: { id }
  })
  return mapStore(data || {})
}

// 新增门店
export const createStore = (data: StoreVO) => {
  return request.post({
    url: '/trade/pharmacy-store/create',
    data: toBackendPayload(data)
  })
}

// 修改门店
export const updateStore = (data: StoreVO) => {
  return request.put({
    url: '/trade/pharmacy-store/update',
    data: toBackendPayload(data)
  })
}

// 删除门店
export const deleteStore = (id: number) => {
  return request.delete({
    url: '/trade/pharmacy-store/delete',
    params: { id }
  })
}
