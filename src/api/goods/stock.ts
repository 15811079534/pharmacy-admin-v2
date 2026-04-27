import request from '@/utils/request'
import * as GoodsApi from '@/api/goods/goods'

export interface StockVO {
  id?: number
  goodsId: number
  goodsName?: string
  stock: number
  alertStock: number
  inboundTotal: number
  outboundTotal: number
  updateTime?: string
}

export interface StockPageReqVO {
  goodsName?: string
  stockStatus?: number
  pageNo: number
  pageSize: number
}

export interface InboundStockReqVO {
  goodsId: number
  quantity: number
  remark?: string
}

export interface OutboundStockReqVO {
  goodsId: number
  quantity: number
  remark?: string
}

interface ProductSpuRecord {
  id?: number
  name?: string
  stock?: number
  createTime?: string | number
}

interface StockOperationStats {
  inboundTotal: number
  outboundTotal: number
  lastOperateTime?: string
}

const STOCK_STATS_KEY = 'stock-operation-stats'

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

const getStockStatsMap = (): Record<number, StockOperationStats> => {
  try {
    const raw = localStorage.getItem(STOCK_STATS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const saveStockStatsMap = (statsMap: Record<number, StockOperationStats>) => {
  localStorage.setItem(STOCK_STATS_KEY, JSON.stringify(statsMap))
}

const getGoodsStats = (goodsId?: number): StockOperationStats => {
  if (!goodsId) {
    return {
      inboundTotal: 0,
      outboundTotal: 0
    }
  }
  const statsMap = getStockStatsMap()
  return statsMap[goodsId] || {
    inboundTotal: 0,
    outboundTotal: 0
  }
}

const recordStockOperation = (goodsId: number, type: 'inbound' | 'outbound', quantity: number) => {
  const validQuantity = Math.max(0, Number(quantity || 0))
  if (!goodsId || validQuantity <= 0) return

  const statsMap = getStockStatsMap()
  const current = statsMap[goodsId] || { inboundTotal: 0, outboundTotal: 0 }
  const next: StockOperationStats = {
    inboundTotal: current.inboundTotal + (type === 'inbound' ? validQuantity : 0),
    outboundTotal: current.outboundTotal + (type === 'outbound' ? validQuantity : 0),
    lastOperateTime: formatDateTime(Date.now())
  }
  statsMap[goodsId] = next
  saveStockStatsMap(statsMap)
}

const getDynamicAlertStock = (stock: number) => {
  const normalizedStock = Math.max(0, Number(stock || 0))
  if (normalizedStock <= 0) return 5
  return Math.max(5, Math.min(50, Math.ceil(normalizedStock * 0.2)))
}

const mapStock = (item: ProductSpuRecord): StockVO => {
  const stats = getGoodsStats(item.id)
  const currentStock = Number(item.stock || 0)
  return {
    id: item.id,
    goodsId: item.id || 0,
    goodsName: item.name || '',
    stock: currentStock,
    alertStock: getDynamicAlertStock(currentStock),
    inboundTotal: stats.inboundTotal,
    outboundTotal: stats.outboundTotal,
    updateTime: stats.lastOperateTime || formatDateTime(item.createTime)
  }
}

const matchesStockStatus = (item: StockVO, status?: number) => {
  if (status === undefined) return true
  if (status === 0) return item.stock > item.alertStock
  if (status === 1) return item.stock > 0 && item.stock <= item.alertStock
  if (status === 2) return item.stock === 0
  return true
}

const getPageBounds = (pageNo: number, pageSize: number) => {
  const safePageNo = Math.max(1, Number(pageNo || 1))
  const safePageSize = Math.max(1, Number(pageSize || 10))
  const start = (safePageNo - 1) * safePageSize
  return {
    start,
    end: start + safePageSize
  }
}

const fetchSpuPage = async (params: { goodsName?: string; pageNo: number; pageSize: number }) => {
  return request.get<{ list: ProductSpuRecord[]; total: number }>({
    url: '/product/spu/page',
    params: {
      name: params.goodsName,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    }
  })
}

const fetchAllSpuRecords = async (goodsName?: string) => {
  const batchSize = 200
  const firstPage = await fetchSpuPage({
    goodsName,
    pageNo: 1,
    pageSize: batchSize
  })

  const total = Number(firstPage.total || 0)
  const list = [...(firstPage.list || [])]

  if (total <= list.length) {
    return list
  }

  const totalPages = Math.ceil(total / batchSize)
  for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
    const pageData = await fetchSpuPage({
      goodsName,
      pageNo,
      pageSize: batchSize
    })
    list.push(...(pageData.list || []))
  }

  return list
}

// 查询库存分页
export const getStockPage = async (params: StockPageReqVO) => {
  if (params.stockStatus === undefined) {
    const data = await fetchSpuPage({
      goodsName: params.goodsName,
      pageNo: params.pageNo,
      pageSize: params.pageSize
    })

    return {
      list: (data.list || []).map(mapStock),
      total: data.total || 0
    }
  }

  const allRecords = await fetchAllSpuRecords(params.goodsName)
  const filtered = allRecords.map(mapStock).filter((item) => matchesStockStatus(item, params.stockStatus))
  const { start, end } = getPageBounds(params.pageNo, params.pageSize)

  return {
    list: filtered.slice(start, end),
    total: filtered.length
  }
}

// 查询库存详情
export const getStock = async (id: number) => {
  const detail = await GoodsApi.getGoods(id)
  const stats = getGoodsStats(detail.id)
  const currentStock = Number(detail.stock || 0)
  return {
    id: detail.id,
    goodsId: detail.id || 0,
    goodsName: detail.name,
    stock: currentStock,
    alertStock: getDynamicAlertStock(currentStock),
    inboundTotal: stats.inboundTotal,
    outboundTotal: stats.outboundTotal,
    updateTime: stats.lastOperateTime || detail.createTime
  }
}

// 入库（基于真实商品更新接口调整库存）
export const inboundStock = async (data: InboundStockReqVO) => {
  const quantity = Math.max(0, Number(data.quantity || 0))
  const goods = await GoodsApi.getGoods(data.goodsId)
  goods.stock = Number(goods.stock || 0) + quantity
  await GoodsApi.updateGoods(goods)
  recordStockOperation(data.goodsId, 'inbound', quantity)
}

// 出库（基于真实商品更新接口调整库存）
export const outboundStock = async (data: OutboundStockReqVO) => {
  const goods = await GoodsApi.getGoods(data.goodsId)
  const quantity = Math.max(0, Number(data.quantity || 0))
  const currentStock = Number(goods.stock || 0)
  if (currentStock < quantity) {
    throw new Error('库存不足，无法出库')
  }
  goods.stock = currentStock - quantity
  await GoodsApi.updateGoods(goods)
  recordStockOperation(data.goodsId, 'outbound', quantity)
}

// 获取药品列表（用于下拉选择）
export const getGoodsList = async () => {
  const list = await request.get<Array<{ id: number; name: string }>>({
    url: '/product/spu/list-all-simple'
  })
  return (list || []).map((item) => ({
    id: item.id,
    name: item.name
  }))
}
