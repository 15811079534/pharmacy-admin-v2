import request from '@/utils/request'

export interface InsuranceVO {
  id?: number
  userId?: number
  name: string
  cardNo: string
  idCard: string
  cardType?: number
  balance?: number
  status: number
  bindTime?: string
  createTime?: string
}

export interface InsurancePageReqVO {
  userName?: string
  cardNo?: string
  status?: number
  pageNo: number
  pageSize: number
}

interface AdminInsuranceRecord {
  id?: number
  userId?: number
  name?: string
  cardNo?: string
  idCard?: string
  cardType?: number
  balance?: number
  status?: number
  bindTime?: string | number
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

const mapInsurance = (item: AdminInsuranceRecord): InsuranceVO => ({
  id: item.id,
  userId: item.userId,
  name: item.name || '',
  cardNo: item.cardNo || '',
  idCard: item.idCard || '',
  cardType: item.cardType,
  balance: item.balance ?? 0,
  status: item.status ?? 0,
  bindTime: formatDateTime(item.bindTime),
  createTime: formatDateTime(item.createTime)
})

// 查询医保申请分页
export const getInsurancePage = async (params: InsurancePageReqVO) => {
  const data = await request.get<{ list: AdminInsuranceRecord[]; total: number }>({
    url: '/trade/insurance/page',
    params
  })
  return {
    list: (data.list || []).map(mapInsurance),
    total: data.total || 0
  }
}

// 查询医保申请详情
export const getInsurance = async (id: number) => {
  const data = await request.get<AdminInsuranceRecord>({
    url: '/trade/insurance/get',
    params: { id }
  })
  return mapInsurance(data || {})
}

// 审核通过医保申请
export const approveInsurance = (id: number) => {
  return request.put({
    url: `/trade/insurance/approve?id=${id}`
  })
}

// 审核拒绝医保申请
export const rejectInsurance = (id: number, reason: string) => {
  return request.put({
    url: '/trade/insurance/reject',
    data: { id, reason }
  })
}
