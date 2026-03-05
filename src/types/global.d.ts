// 通用分页参数
export interface PageParam {
  pageNo: number
  pageSize: number
}

// 通用分页结果
export interface PageResult<T> {
  list: T[]
  total: number
}

// 通用响应结构
export interface Result<T = any> {
  code: number
  data: T
  msg: string
}

// 字典数据
export interface DictDataType {
  label: string
  value: string | number
  colorType?: string
  cssClass?: string
}
