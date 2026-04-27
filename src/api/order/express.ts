import request from '@/utils/request'

export interface ExpressVO {
  id?: number
  code: string
  name: string
  logo?: string
  sort: number
  status: number
  createTime?: string
}

export interface ExpressPageReqVO {
  code?: string
  name?: string
  status?: number
  pageNo: number
  pageSize: number
}

interface BackendExpressRecord {
  id?: number
  code?: string
  name?: string
  logo?: string
  sort?: number
  status?: number
  createTime?: string | number
}

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

const normalizeLogo = (logo?: string) => {
  if (!logo || logo.includes('vite.svg')) {
    return ''
  }
  return logo
}

const mapExpress = (item: BackendExpressRecord): ExpressVO => ({
  id: item.id,
  code: item.code || '',
  name: item.name || '',
  logo: normalizeLogo(item.logo),
  sort: Number(item.sort || 0),
  status: Number(item.status ?? 0),
  createTime: formatDateTime(item.createTime)
})

const mapToBackend = (data: ExpressVO) => ({
  id: data.id,
  code: data.code,
  name: data.name,
  logo: data.logo || '',
  sort: Number(data.sort || 0),
  status: Number(data.status ?? 0)
})

const normalizeExpressApiError = (error: any, action: string) => {
  const message = String(error?.message || '')
  if (message.includes('404') || message.includes('Not Found')) {
    return new Error(
      '当前后端未部署物流公司管理接口，请先发布 pharmacy-server 最新版本（DeliveryExpressController 完整 CRUD 接口）'
    )
  }
  if (message === '系统异常') {
    return new Error(`物流公司${action}失败：后端返回系统异常，请检查服务日志与数据库表结构`)
  }
  return error
}

export const getExpressPage = async (params: ExpressPageReqVO) => {
  try {
    const data = await request.get<{ list: BackendExpressRecord[]; total: number }>({
      url: '/trade/delivery/express/page',
      params
    })
    return {
      list: (data.list || []).map(mapExpress),
      total: data.total || 0
    }
  } catch (error) {
    throw normalizeExpressApiError(error, '分页查询')
  }
}

export const getExpress = async (id: number) => {
  try {
    const data = await request.get<BackendExpressRecord>({
      url: '/trade/delivery/express/get',
      params: { id }
    })
    return mapExpress(data || {})
  } catch (error) {
    throw normalizeExpressApiError(error, '详情查询')
  }
}

export const createExpress = (data: ExpressVO) => {
  return request
    .post<number>({
      url: '/trade/delivery/express/create',
      data: mapToBackend(data)
    })
    .catch((error) => {
      throw normalizeExpressApiError(error, '创建')
    })
}

export const updateExpress = (data: ExpressVO) => {
  return request
    .put({
      url: '/trade/delivery/express/update',
      data: mapToBackend(data)
    })
    .catch((error) => {
      throw normalizeExpressApiError(error, '更新')
    })
}

export const deleteExpress = (id: number) => {
  return request
    .delete({
      url: '/trade/delivery/express/delete',
      params: { id }
    })
    .catch((error) => {
      throw normalizeExpressApiError(error, '删除')
    })
}
