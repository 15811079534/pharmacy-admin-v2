import request from '@/utils/request'

export interface BannerVO {
  id?: number
  title: string
  image: string
  linkType: number
  linkValue: string
  sort: number
  status: number
  createTime?: string
}

export interface BannerPageReqVO {
  title?: string
  status?: number
  pageNo: number
  pageSize: number
}

interface BackendBannerVO {
  id?: number
  title?: string
  url?: string
  picUrl?: string
  position?: number
  sort?: number
  status?: number
  memo?: string
  createTime?: string
}

const inferLinkType = (url?: string) => {
  if (!url) return 2
  if (/^https?:\/\//i.test(url)) return 3
  if (/^\d+$/.test(url)) return 1
  return 2
}

const mapToView = (item: BackendBannerVO): BannerVO => ({
  id: item.id,
  title: item.title || '',
  image: item.picUrl || '',
  linkType: inferLinkType(item.url),
  linkValue: item.url || '',
  sort: Number(item.sort || 0),
  status: Number(item.status ?? 0),
  createTime: item.createTime
})

const mapToBackend = (data: BannerVO): BackendBannerVO => ({
  id: data.id,
  title: data.title,
  url: data.linkValue,
  picUrl: data.image,
  position: 1,
  sort: Number(data.sort || 0),
  status: Number(data.status ?? 0),
  memo: `linkType:${data.linkType}`
})

// 查询轮播图分页
export const getBannerPage = (params: BannerPageReqVO) => {
  return request.get<{ list: BackendBannerVO[]; total: number }>({
    url: '/promotion/banner/page',
    params
  }).then((data) => ({
    list: (data.list || []).map(mapToView),
    total: data.total || 0
  }))
}

// 查询轮播图详情
export const getBanner = (id: number) => {
  return request.get<BackendBannerVO>({
    url: '/promotion/banner/get',
    params: { id }
  }).then((item) => mapToView(item || {}))
}

// 新增轮播图
export const createBanner = (data: BannerVO) => {
  return request.post({
    url: '/promotion/banner/create',
    data: mapToBackend(data)
  })
}

// 修改轮播图
export const updateBanner = (data: BannerVO) => {
  return request.put({
    url: '/promotion/banner/update',
    data: mapToBackend(data)
  })
}

// 删除轮播图
export const deleteBanner = (id: number) => {
  return request.delete({
    url: '/promotion/banner/delete',
    params: { id }
  })
}
