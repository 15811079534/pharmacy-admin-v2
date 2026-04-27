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

const stripHtml = (value?: string) => {
  if (!value) {
    return ''
  }
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const mapNotice = (item: NoticeRecord): NoticeVO => ({
  id: item.id,
  title: item.title || '',
  content: stripHtml(item.content),
  type: Number(item.type ?? 1),
  sort: 0,
  status: Number(item.status ?? 0),
  createTime: formatDateTime(item.createTime)
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
