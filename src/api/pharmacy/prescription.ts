import request from '@/utils/request'

export interface PrescriptionVO {
  id?: number
  prescriptionNo: string
  userId?: number
  orderId?: number
  imageUrls: string[]
  status: number
  auditUserId?: number
  auditTime?: string
  rejectReason?: string
  createTime?: string
}

export interface PrescriptionPageReqVO {
  prescriptionNo?: string
  userId?: number
  status?: number
  pageNo: number
  pageSize: number
}

interface AdminPrescriptionRecord {
  id?: number
  prescriptionNo?: string
  userId?: number
  orderId?: number
  auditUserId?: number
  auditTime?: string | number
  rejectReason?: string
  status?: number
  createTime?: string | number
  imageUrls?: string[]
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

const mapPrescription = (item: AdminPrescriptionRecord): PrescriptionVO => ({
  id: item.id,
  prescriptionNo: item.prescriptionNo || '',
  userId: item.userId,
  orderId: item.orderId,
  imageUrls: item.imageUrls || [],
  status: item.status ?? 0,
  auditUserId: item.auditUserId,
  auditTime: formatDateTime(item.auditTime),
  rejectReason: item.rejectReason || '',
  createTime: formatDateTime(item.createTime)
})

// 查询处方分页
export const getPrescriptionPage = async (params: PrescriptionPageReqVO) => {
  const useLocalFilter = Boolean(params.prescriptionNo || params.userId)
  const data = await request.get<{ list: AdminPrescriptionRecord[]; total: number }>({
    url: '/trade/admin/prescription/page',
    params: {
      status: params.status,
      pageNo: useLocalFilter ? 1 : params.pageNo,
      pageSize: useLocalFilter ? 500 : params.pageSize
    }
  })
  const mapped = (data.list || []).map(mapPrescription)
  const filtered = mapped.filter((item) => {
    const noOk = params.prescriptionNo ? item.prescriptionNo.includes(params.prescriptionNo) : true
    const userOk = params.userId ? Number(item.userId) === Number(params.userId) : true
    return noOk && userOk
  })

  if (!useLocalFilter) {
    return {
      list: filtered,
      total: data.total || 0
    }
  }

  const start = (params.pageNo - 1) * params.pageSize
  return {
    list: filtered.slice(start, start + params.pageSize),
    total: filtered.length
  }
}

// 查询处方详情
export const getPrescription = async (id: number) => {
  const data = await request.get<AdminPrescriptionRecord>({
    url: '/trade/admin/prescription/get',
    params: { id }
  })
  return mapPrescription(data || {})
}

// 审核处方
export const approvePrescription = (id: number) => {
  return request.put({
    url: '/trade/admin/prescription/audit',
    data: { id, approved: true }
  })
}

// 拒绝处方
export const rejectPrescription = (id: number, reason: string) => {
  return request.put({
    url: '/trade/admin/prescription/audit',
    data: { id, approved: false, rejectReason: reason }
  })
}
