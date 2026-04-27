import request from '@/utils/request'

export interface MemberLevelVO {
  id?: number
  name: string
  experience: number
  level: number
  discountPercent: number
  icon?: string
  backgroundUrl?: string
  status: number
  createTime?: string
}

export interface MemberLevelListReqVO {
  name?: string
  status?: number
}

export interface MemberLevelSimpleVO {
  id: number
  name: string
  icon?: string
}

interface BackendMemberLevelVO {
  id?: number
  name?: string
  experience?: number
  level?: number
  discountPercent?: number
  icon?: string
  backgroundUrl?: string
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

const mapToView = (item: BackendMemberLevelVO): MemberLevelVO => ({
  id: item.id ? Number(item.id) : undefined,
  name: item.name || '',
  experience: Number(item.experience || 0),
  level: Number(item.level || 0),
  discountPercent: Number(item.discountPercent || 100),
  icon: item.icon || '',
  backgroundUrl: item.backgroundUrl || '',
  status: Number(item.status ?? 0),
  createTime: formatDateTime(item.createTime)
})

const mapToBackend = (data: MemberLevelVO) => ({
  id: data.id,
  name: data.name,
  experience: Number(data.experience || 0),
  level: Number(data.level || 0),
  discountPercent: Number(data.discountPercent ?? 100),
  icon: data.icon || '',
  backgroundUrl: data.backgroundUrl || '',
  status: Number(data.status ?? 0)
})

export const getMemberLevelList = async (params: MemberLevelListReqVO) => {
  const list = await request.get<BackendMemberLevelVO[]>({
    url: '/member/level/list',
    params
  })
  return (list || []).map(mapToView)
}

export const getMemberLevel = async (id: number) => {
  const data = await request.get<BackendMemberLevelVO>({
    url: '/member/level/get',
    params: { id }
  })
  return mapToView(data || {})
}

export const createMemberLevel = (data: MemberLevelVO) => {
  return request.post<number>({
    url: '/member/level/create',
    data: mapToBackend(data)
  })
}

export const updateMemberLevel = (data: MemberLevelVO) => {
  return request.put({
    url: '/member/level/update',
    data: mapToBackend(data)
  })
}

export const deleteMemberLevel = (id: number) => {
  return request.delete({
    url: '/member/level/delete',
    params: { id }
  })
}

export const getMemberLevelSimpleList = async () => {
  const list = await request.get<Array<{ id?: number; name?: string; icon?: string }>>({
    url: '/member/level/list-all-simple'
  })
  return (list || [])
    .filter((item) => item.id)
    .map((item) => ({
      id: Number(item.id),
      name: item.name || `等级#${item.id}`,
      icon: item.icon || ''
    }))
}
