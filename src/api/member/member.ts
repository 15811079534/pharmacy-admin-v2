import request from '@/utils/request'

export interface MemberVO {
  id?: number
  nickname: string
  avatar?: string
  phone: string
  levelId: number
  levelName?: string
  balance: number
  points: number
  createTime?: string
}

export interface MemberPageReqVO {
  nickname?: string
  phone?: string
  levelId?: number
  pageNo: number
  pageSize: number
}

interface MemberUserRecord {
  id?: number
  nickname?: string
  avatar?: string
  mobile?: string
  levelId?: number
  levelName?: string
  status?: number | string
  point?: number
  totalPoint?: number
  createTime?: string | number
  birthday?: string | number
  name?: string
  sex?: number
  areaId?: number
  areaName?: string
  mark?: string
  tagIds?: number[]
  groupId?: number
}

const DEFAULT_AVATAR = 'https://static.iocoder.cn/ruoyi-vue-pro-logo.png'

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

const mapMember = (item: MemberUserRecord): MemberVO => ({
  id: item.id,
  nickname: item.nickname || '',
  avatar: item.avatar || DEFAULT_AVATAR,
  phone: item.mobile || '',
  levelId: Number(item.levelId || 0),
  levelName: item.levelName || '',
  balance: 0,
  points: Number(item.point ?? item.totalPoint ?? 0),
  createTime: formatDateTime(item.createTime)
})

export const getMemberPage = async (params: MemberPageReqVO) => {
  const data = await request.get<{ list: MemberUserRecord[]; total: number }>({
    url: '/member/user/page',
    params: {
      nickname: params.nickname,
      mobile: params.phone,
      levelId: params.levelId,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
  return {
    list: (data.list || []).map(mapMember),
    total: data.total || 0
  }
}

export const getMember = async (id: number) => {
  const data = await request.get<MemberUserRecord>({
    url: '/member/user/get',
    params: { id }
  })
  return mapMember(data || {})
}

export const updateMember = async (data: MemberVO) => {
  if (!data.id) {
    throw new Error('缺少会员 ID，无法更新')
  }
  const current = await request.get<MemberUserRecord>({
    url: '/member/user/get',
    params: { id: data.id }
  })
  return request.put({
    url: '/member/user/update',
    data: {
      id: data.id,
      mobile: data.phone || current?.mobile || '',
      status: Number(current?.status ?? 0),
      nickname: data.nickname || current?.nickname || '',
      avatar: data.avatar || current?.avatar || DEFAULT_AVATAR,
      name: current?.name,
      sex: current?.sex,
      areaId: current?.areaId,
      areaName: current?.areaName,
      birthday: current?.birthday,
      mark: current?.mark,
      tagIds: current?.tagIds || [],
      levelId: data.levelId ?? current?.levelId,
      groupId: current?.groupId
    }
  })
}

export const exportMember = (params: MemberPageReqVO) => {
  return request.download({
    url: '/member/user/export-excel',
    params: {
      nickname: params.nickname,
      mobile: params.phone,
      levelId: params.levelId,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
}
