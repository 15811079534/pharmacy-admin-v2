import request from '@/utils/request'

export const GOODS_VIEW_STATUS = {
  RECYCLE: -1,
  ON_SHELF: 1,
  OFF_SHELF: 0
} as const

export const GOODS_TAB_TYPE = {
  FOR_SALE: 0,
  IN_WAREHOUSE: 1,
  RECYCLE_BIN: 4
} as const

export const DRUG_TYPE = {
  GENERAL: 0,
  OTC_A: 1,
  OTC_B: 2,
  RX: 3
} as const

export type DrugType = (typeof DRUG_TYPE)[keyof typeof DRUG_TYPE]

export const DRUG_TYPE_OPTIONS = [
  {
    value: DRUG_TYPE.GENERAL,
    label: '健康商品',
    tagType: 'info',
    purchaseLabel: '可直接购买'
  },
  {
    value: DRUG_TYPE.OTC_A,
    label: 'OTC甲类',
    tagType: 'success',
    purchaseLabel: '可直接购买'
  },
  {
    value: DRUG_TYPE.OTC_B,
    label: 'OTC乙类',
    tagType: 'warning',
    purchaseLabel: '可直接购买'
  },
  {
    value: DRUG_TYPE.RX,
    label: '处方药 Rx',
    tagType: 'danger',
    purchaseLabel: '先审方后购买'
  }
] as const

export type GoodsViewStatus = (typeof GOODS_VIEW_STATUS)[keyof typeof GOODS_VIEW_STATUS]

export interface GoodsVO {
  id?: number
  name: string
  categoryId: number
  brandId?: number
  categoryName?: string
  image: string
  images?: string[]
  price: number
  stock: number
  sales?: number
  status: GoodsViewStatus
  description?: string
  drugType: DrugType
  prescriptionRequired: boolean
  approvalNumber?: string
  drugInstruction?: string
  createTime?: string
}

export interface GoodsPageReqVO {
  name?: string
  categoryId?: number
  status?: GoodsViewStatus
  tabType?: number
  pageNo: number
  pageSize: number
}

interface ProductSkuRecord {
  id?: number
  name?: string
  price?: number
  marketPrice?: number
  costPrice?: number
  barCode?: string
  picUrl?: string
  stock?: number
  weight?: number
  volume?: number
  firstBrokeragePrice?: number
  secondBrokeragePrice?: number
  properties?: any[]
}

interface ProductSpuRecord {
  id?: number
  name?: string
  keyword?: string
  introduction?: string
  description?: string
  categoryId?: number
  brandId?: number
  picUrl?: string
  sliderPicUrls?: string[]
  sort?: number
  status?: number
  createTime?: string | number
  specType?: boolean
  price?: number
  stock?: number
  skus?: ProductSkuRecord[]
  deliveryTypes?: number[]
  deliveryTemplateId?: number
  giveIntegral?: number
  subCommissionType?: boolean
  drugType?: number
  prescriptionRequired?: boolean
  approvalNumber?: string
  drugInstruction?: string
  salesCount?: number
  virtualSalesCount?: number
  browseCount?: number
}

interface ProductCategoryRecord {
  id?: number
  name?: string
  parentId?: number
  children?: ProductCategoryRecord[]
}

interface CategoryMeta {
  nameMap: Record<number, string>
  leafIdSet: Set<number>
  firstLeafId?: number
}

let defaultBrandIdCache: number | null = null
let categoryMetaCache: CategoryMeta | null = null

export const getDrugTypeMeta = (drugType?: number) => {
  return (
    DRUG_TYPE_OPTIONS.find((item) => item.value === Number(drugType)) ||
    DRUG_TYPE_OPTIONS[0]
  )
}

const normalizeDrugType = (
  drugType?: number,
  prescriptionRequired?: boolean
): DrugType => {
  const normalizedValue = Number(drugType)
  if (Object.values(DRUG_TYPE).includes(normalizedValue as DrugType)) {
    return normalizedValue as DrugType
  }
  return prescriptionRequired ? DRUG_TYPE.RX : DRUG_TYPE.GENERAL
}

const toYuan = (amount?: number) => Number(((amount || 0) / 100).toFixed(2))
const toFen = (amount?: number) => Math.round(Number(amount || 0) * 100)
const normalizeStatus = (status?: number): GoodsViewStatus => {
  if (status === GOODS_VIEW_STATUS.ON_SHELF) return GOODS_VIEW_STATUS.ON_SHELF
  if (status === GOODS_VIEW_STATUS.OFF_SHELF) return GOODS_VIEW_STATUS.OFF_SHELF
  return GOODS_VIEW_STATUS.RECYCLE
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

const stripHtml = (html?: string) => {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').trim()
}

const mapGoods = (item: ProductSpuRecord, categoryNameMap: Record<number, string>): GoodsVO => {
  const drugType = normalizeDrugType(item.drugType, item.prescriptionRequired)

  return {
    id: item.id,
    name: item.name || '',
    categoryId: item.categoryId || 0,
    brandId: item.brandId ? Number(item.brandId) : undefined,
    categoryName: item.categoryId ? categoryNameMap[item.categoryId] || '' : '',
    image: item.picUrl || '',
    images: item.sliderPicUrls || [],
    price: toYuan(item.price),
    stock: Number(item.stock || item.skus?.[0]?.stock || 0),
    sales: Number(item.salesCount || 0) + Number(item.virtualSalesCount || 0),
    status: normalizeStatus(item.status),
    description: stripHtml(item.description || item.introduction),
    drugType,
    prescriptionRequired: drugType === DRUG_TYPE.RX,
    approvalNumber: item.approvalNumber || '',
    drugInstruction: item.drugInstruction || '',
    createTime: formatDateTime(item.createTime)
  }
}

const buildCategoryMeta = (list: ProductCategoryRecord[]): CategoryMeta => {
  const nameMap: Record<number, string> = {}
  const leafIdSet = new Set<number>()
  const parentIdMap = new Map<number, number>()
  const childParentIds = new Set<number>()

  const walk = (items: ProductCategoryRecord[]) => {
    items.forEach((item) => {
      if (item.id && item.name) {
        nameMap[item.id] = item.name
        parentIdMap.set(item.id, Number(item.parentId || 0))
        if (item.parentId && Number(item.parentId) > 0) {
          childParentIds.add(Number(item.parentId))
        }
      }
      if (item.children?.length) {
        walk(item.children)
      }
    })
  }
  walk(list || [])

  const getDepth = (id: number) => {
    let depth = 1
    let parentId = parentIdMap.get(id) || 0
    const visited = new Set<number>([id])
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId)
      depth += 1
      parentId = parentIdMap.get(parentId) || 0
    }
    return depth
  }

  parentIdMap.forEach((_parentId, id) => {
    const hasChild = childParentIds.has(id)
    if (!hasChild && getDepth(id) >= 2) {
      leafIdSet.add(id)
    }
  })

  const [firstLeafId] = [...leafIdSet]
  return {
    nameMap,
    leafIdSet,
    firstLeafId
  }
}

const getCategoryMeta = async () => {
  if (categoryMetaCache) {
    return categoryMetaCache
  }
  const list = await request.get<ProductCategoryRecord[]>({
    url: '/product/category/list',
    params: {}
  })
  categoryMetaCache = buildCategoryMeta(list || [])
  return categoryMetaCache
}

const getCategoryNameMap = async () => {
  const meta = await getCategoryMeta()
  return meta.nameMap
}

const resolveValidCategoryId = async (categoryId?: number) => {
  const meta = await getCategoryMeta()
  if (categoryId && meta.leafIdSet.has(Number(categoryId))) {
    return Number(categoryId)
  }
  if (meta.firstLeafId) {
    return meta.firstLeafId
  }
  throw new Error('未找到可用的二级分类，请先在药品分类中创建至少一个二级分类')
}

const getDefaultBrandId = async () => {
  if (defaultBrandIdCache) {
    return defaultBrandIdCache
  }
  const list = await request.get<{ id: number }[]>({
    url: '/product/brand/list-all-simple'
  })
  const first = list?.[0]
  if (!first) {
    throw new Error('未找到可用品牌，请先在商品品牌中创建并启用至少一个品牌')
  }
  defaultBrandIdCache = first.id
  return defaultBrandIdCache
}

const buildSkuPayload = (goods: GoodsVO, detail?: ProductSpuRecord) => {
  const detailSku = detail?.skus?.[0]
  const baseName = goods.name || detailSku?.name || detail?.name || '默认规格'
  return [
    {
      id: detailSku?.id,
      name: baseName,
      price: toFen(goods.price),
      marketPrice: detailSku?.marketPrice ?? toFen(goods.price),
      costPrice: detailSku?.costPrice ?? Math.max(0, Math.floor(toFen(goods.price) * 0.7)),
      barCode: detailSku?.barCode,
      picUrl: goods.image || detailSku?.picUrl || detail?.picUrl,
      stock: Math.max(0, Math.floor(Number(goods.stock || 0))),
      weight: detailSku?.weight,
      volume: detailSku?.volume,
      firstBrokeragePrice: detailSku?.firstBrokeragePrice ?? 0,
      secondBrokeragePrice: detailSku?.secondBrokeragePrice ?? 0,
      properties: detailSku?.properties || []
    }
  ]
}

const buildSavePayload = async (goods: GoodsVO, detail?: ProductSpuRecord) => {
  const brandId = Number(goods.brandId ?? detail?.brandId ?? (await getDefaultBrandId()))
  if (!brandId) {
    throw new Error('请选择商品品牌')
  }
  const categoryId = await resolveValidCategoryId(goods.categoryId || detail?.categoryId)
  const drugType = normalizeDrugType(
    goods.drugType,
    goods.prescriptionRequired ?? detail?.prescriptionRequired
  )
  return {
    id: detail?.id || goods.id,
    name: goods.name,
    keyword: detail?.keyword || goods.name,
    introduction: goods.description || detail?.introduction || goods.name,
    description: goods.description || detail?.description || `<p>${goods.name}</p>`,
    categoryId,
    brandId,
    picUrl: goods.image || detail?.picUrl,
    sliderPicUrls:
      goods.images?.length
        ? goods.images
        : [goods.image || detail?.picUrl].filter(Boolean),
    sort: detail?.sort ?? 0,
    specType: false,
    deliveryTypes: detail?.deliveryTypes?.length ? detail.deliveryTypes : [1],
    deliveryTemplateId: detail?.deliveryTemplateId ?? 0,
    giveIntegral: detail?.giveIntegral ?? 0,
    subCommissionType: detail?.subCommissionType ?? false,
    drugType,
    prescriptionRequired: drugType === DRUG_TYPE.RX,
    approvalNumber: goods.approvalNumber || detail?.approvalNumber,
    drugInstruction: goods.drugInstruction || detail?.drugInstruction,
    virtualSalesCount: detail?.virtualSalesCount ?? 0,
    salesCount: detail?.salesCount ?? Number(goods.sales || 0),
    browseCount: detail?.browseCount ?? 0,
    skus: buildSkuPayload(goods, detail)
  }
}

const updateGoodsStatus = (id: number, viewStatus: GoodsViewStatus) => {
  return request.put({
    url: '/product/spu/update-status',
    data: {
      id,
      status: viewStatus
    }
  })
}

const getGoodsDetailRaw = (id: number) => {
  return request.get<ProductSpuRecord>({
    url: '/product/spu/get-detail',
    params: { id }
  })
}

const resolveGoodsTabType = (params: GoodsPageReqVO) => {
  if (params.tabType === GOODS_TAB_TYPE.RECYCLE_BIN) {
    return GOODS_TAB_TYPE.RECYCLE_BIN
  }
  if (params.status === GOODS_VIEW_STATUS.ON_SHELF) {
    return GOODS_TAB_TYPE.FOR_SALE
  }
  if (params.status === GOODS_VIEW_STATUS.OFF_SHELF) {
    return GOODS_TAB_TYPE.IN_WAREHOUSE
  }
  return undefined
}

const buildGoodsPageParams = (params: GoodsPageReqVO) => ({
  name: params.name,
  categoryId: params.categoryId && params.categoryId > 0 ? params.categoryId : undefined,
  tabType: resolveGoodsTabType(params),
  pageNo: params.pageNo,
  pageSize: params.pageSize
})

// 查询药品分页
export const getGoodsPage = async (params: GoodsPageReqVO) => {
  const data = await request.get<{ list: ProductSpuRecord[]; total: number }>({
    url: '/product/spu/page',
    params: buildGoodsPageParams(params)
  })
  const categoryNameMap = await getCategoryNameMap()
  return {
    list: (data.list || []).map((item) => mapGoods(item, categoryNameMap)),
    total: data.total || 0
  }
}

// 查询药品详情
export const getGoods = async (id: number) => {
  const data = await getGoodsDetailRaw(id)
  const categoryNameMap = await getCategoryNameMap()
  return mapGoods(data || {}, categoryNameMap)
}

// 新增药品
export const createGoods = async (data: GoodsVO) => {
  const payload = await buildSavePayload(data)
  const id = await request.post<number>({
    url: '/product/spu/create',
    data: payload
  })
  await updateGoodsStatus(id, data.status)
  return id
}

// 修改药品
export const updateGoods = async (data: GoodsVO) => {
  if (!data.id) {
    throw new Error('缺少药品 ID，无法更新')
  }
  const detail = await getGoodsDetailRaw(data.id)
  const payload = await buildSavePayload(data, detail || undefined)
  await request.put({
    url: '/product/spu/update',
    data: payload
  })
  await updateGoodsStatus(data.id, data.status)
}

// 移入回收站
export const moveGoodsToRecycle = (id: number) => {
  return updateGoodsStatus(id, GOODS_VIEW_STATUS.RECYCLE)
}

// 从回收站恢复，默认恢复为下架状态
export const restoreGoods = (id: number, status: GoodsViewStatus = GOODS_VIEW_STATUS.OFF_SHELF) => {
  return updateGoodsStatus(id, status)
}

// 删除药品
export const deleteGoods = (id: number) => {
  return request.delete({
    url: '/product/spu/delete',
    params: { id }
  })
}

// 导出药品
export const exportGoods = (params: GoodsPageReqVO) => {
  return request.download({
    url: '/product/spu/export-excel',
    params: buildGoodsPageParams(params)
  })
}
