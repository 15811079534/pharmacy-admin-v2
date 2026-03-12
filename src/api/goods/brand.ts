import request from '@/utils/request'

export interface BrandVO {
  id?: number
  name: string
  logo: string
  sort: number
  description?: string
  status: number
  createTime?: string
}

export interface BrandPageReqVO {
  name?: string
  status?: number
  pageNo: number
  pageSize: number
}

export interface BrandSimpleVO {
  id: number
  name: string
}

interface BackendBrandVO {
  id?: number
  name?: string
  picUrl?: string
  sort?: number
  description?: string
  status?: number
  createTime?: string
}

const mapToView = (item: BackendBrandVO): BrandVO => ({
  id: item.id,
  name: item.name || '',
  logo: item.picUrl || '',
  sort: Number(item.sort || 0),
  description: item.description || '',
  status: Number(item.status ?? 0),
  createTime: item.createTime
})

const mapToBackend = (data: BrandVO) => ({
  id: data.id,
  name: data.name,
  picUrl: data.logo || '',
  sort: Number(data.sort || 0),
  description: data.description || '',
  status: Number(data.status ?? 0)
})

export const getBrandPage = async (params: BrandPageReqVO) => {
  const data = await request.get<{ list: BackendBrandVO[]; total: number }>({
    url: '/product/brand/page',
    params
  })
  return {
    list: (data.list || []).map(mapToView),
    total: data.total || 0
  }
}

export const getBrand = async (id: number) => {
  const data = await request.get<BackendBrandVO>({
    url: '/product/brand/get',
    params: { id }
  })
  return mapToView(data || {})
}

export const createBrand = (data: BrandVO) => {
  return request.post<number>({
    url: '/product/brand/create',
    data: mapToBackend(data)
  })
}

export const updateBrand = (data: BrandVO) => {
  return request.put({
    url: '/product/brand/update',
    data: mapToBackend(data)
  })
}

export const deleteBrand = (id: number) => {
  return request.delete({
    url: '/product/brand/delete',
    params: { id }
  })
}

export const getBrandSimpleList = async () => {
  const list = await request.get<Array<{ id?: number; name?: string }>>({
    url: '/product/brand/list-all-simple'
  })
  return (list || [])
    .filter((item) => item.id)
    .map((item) => ({
      id: Number(item.id),
      name: item.name || `品牌#${item.id}`
    }))
}
