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
  createTime?: string | number
  children?: BackendCategoryVO[]
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

const mapToView = (item: BackendCategoryVO): CategoryVO => ({
  id: item.id,
  parentId: item.parentId,
  name: item.name || '',
  icon: item.picUrl || '',
  sort: Number(item.sort || 0),
  status: Number(item.status ?? 0),
  createTime: formatDateTime(item.createTime),
  children: []
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

const flattenBackendCategories = (items: BackendCategoryVO[]): BackendCategoryVO[] => {
  return items.reduce<BackendCategoryVO[]>((acc, item) => {
    acc.push({
      ...item,
      children: undefined
    })
    if (item.children?.length) {
      acc.push(...flattenBackendCategories(item.children))
    }
    return acc
  }, [])
}

const sortCategoryTree = (items: CategoryVO[]) => {
  items.sort((a, b) => {
    const sortDiff = Number(a.sort || 0) - Number(b.sort || 0)
    if (sortDiff !== 0) {
      return sortDiff
    }
    return Number(a.id || 0) - Number(b.id || 0)
  })
  items.forEach((item) => {
    if (item.children?.length) {
      sortCategoryTree(item.children)
    }
  })
  return items
}

const buildCategoryTree = (list: CategoryVO[]) => {
  const nodeMap = new Map<number, CategoryVO>()
  const roots: CategoryVO[] = []

  list.forEach((item) => {
    if (!item.id) {
      roots.push(item)
      return
    }
    nodeMap.set(item.id, {
      ...item,
      children: []
    })
  })

  list.forEach((item) => {
    if (!item.id) {
      return
    }
    const current = nodeMap.get(item.id)
    if (!current) {
      return
    }
    const parentId = Number(item.parentId || 0)
    const parent = parentId ? nodeMap.get(parentId) : undefined
    if (!parent) {
      roots.push(current)
      return
    }
    parent.children = parent.children || []
    parent.children.push(current)
  })

  return sortCategoryTree(roots)
}

export const getCategoryList = (params: CategoryPageReqVO) => {
  return request.get<BackendCategoryVO[]>({
    url: '/product/category/list',
    params
  }).then((list) => buildCategoryTree(flattenBackendCategories(list || []).map(mapToView)))
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
