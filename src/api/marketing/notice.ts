import request from '@/utils/request'

export interface NoticeVO {
  id?: number
  title: string
  content: string
  type: number
  sort: number
  status: number
  createTime?: string
}

export interface NoticePageReqVO {
  title?: string
  status?: number
  pageNo: number
  pageSize: number
}

interface NoticeRecord {
  id?: number
  title?: string
  content?: string
  type?: number
  status?: number
  createTime?: string
}

const mapNotice = (item: NoticeRecord): NoticeVO => ({
  id: item.id,
  title: item.title || '',
  content: item.content || '',
  type: Number(item.type ?? 1),
  sort: 0,
  status: Number(item.status ?? 0),
  createTime: item.createTime
})

export const getNoticePage = async (params: NoticePageReqVO) => {
  const data = await request.get<{ list: NoticeRecord[]; total: number }>({
    url: '/system/notice/page',
    params
  })
  return {
    list: (data.list || []).map(mapNotice),
    total: data.total || 0
  }
}

export const getNotice = async (id: number) => {
  const data = await request.get<NoticeRecord>({
    url: '/system/notice/get',
    params: { id }
  })
  return mapNotice(data || {})
}

export const createNotice = (data: NoticeVO) => {
  return request.post({
    url: '/system/notice/create',
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      status: data.status
    }
  })
}

export const updateNotice = (data: NoticeVO) => {
  return request.put({
    url: '/system/notice/update',
    data: {
      id: data.id,
      title: data.title,
      content: data.content,
      type: data.type,
      status: data.status
    }
  })
}

export const deleteNotice = (id: number) => {
  return request.delete({
    url: '/system/notice/delete',
    params: { id }
  })
}
