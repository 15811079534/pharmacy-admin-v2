import request from '@/utils/request'

export interface CategoryVO {
  id?: number
  name: string
  icon?: string
  sort: number
  status: number
  parentId?: number
  children?: CategoryVO[]
  createTime?: string
}

export interface CategoryPageReqVO {
  name?: string
  status?: number
}

interface BackendCategoryVO {
  id?: number
  parentId?: number
  name?: string
  picUrl?: string
  sort?: number
  status?: number
  description?: string
  createTime?: string
  children?: BackendCategoryVO[]
}

const mapToView = (item: BackendCategoryVO): CategoryVO => ({
  id: item.id,
  parentId: item.parentId,
  name: item.name || '',
  icon: item.picUrl || '',
  sort: Number(item.sort || 0),
  status: Number(item.status ?? 0),
  createTime: item.createTime,
  children: (item.children || []).map(mapToView)
})

const mapToBackend = (data: CategoryVO) => ({
  id: data.id,
  parentId: data.parentId ?? 0,
  name: data.name,
  picUrl: data.icon || '',
  sort: Number(data.sort || 0),
  status: Number(data.status ?? 0),
  description: ''
})

export const getCategoryList = (params: CategoryPageReqVO) => {
  return request.get<BackendCategoryVO[]>({
    url: '/product/category/list',
    params
  }).then((list) => (list || []).map(mapToView))
}

export const getCategory = (id: number) => {
  return request.get<BackendCategoryVO>({
    url: '/product/category/get',
    params: { id }
  }).then((item) => mapToView(item || {}))
}

export const createCategory = (data: CategoryVO) => {
  return request.post({
    url: '/product/category/create',
    data: mapToBackend(data)
  })
}

export const updateCategory = (data: CategoryVO) => {
  return request.put({
    url: '/product/category/update',
    data: mapToBackend(data)
  })
}

export const deleteCategory = (id: number) => {
  return request.delete({
    url: '/product/category/delete',
    params: { id }
  })
}
