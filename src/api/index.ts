// 认证相关
export * from './auth'

// 药品管理
export * from './goods/goods'
export * from './goods/category'
export * from './goods/brand'
export * from './goods/stock'

// 订单管理
export * from './order/order'
export * from './order/aftersale'
export * from './order/express'
export {
  getLogisticsPage,
  getLogistics,
  updateLogistics,
  trackLogistics
} from './order/logistics'

// 医疗业务
export * from './pharmacy/store'
export * from './pharmacy/prescription'
export * from './pharmacy/insurance'

// 会员管理
export * from './member/member'
export * from './member/level'

// 营销管理
export * from './marketing/banner'
export * from './marketing/notice'

// 看板聚合
export * from './dashboard'
