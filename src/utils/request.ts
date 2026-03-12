import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { ElMessageBox } from 'element-plus'

export interface RequestError extends Error {
  code?: number
  __messageShown?: boolean
}

export const hasMessageShown = (error: unknown): boolean => {
  return Boolean((error as RequestError)?.__messageShown)
}

export const markMessageShown = (error: unknown) => {
  if (error && typeof error === 'object') {
    ;(error as RequestError).__messageShown = true
  }
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

const clearAuthCache = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加租户 ID（项目框架必需）
    config.headers['tenant-id'] = '1'

    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 下载等二进制响应直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data
    }

    const res = response.data || {}

    // 项目框架响应格式: { code: 0, data: any, msg: string }
    // code === 0 表示成功
    if (res.code !== 0) {
      // 401: Token 过期
      if (res.code === 401) {
        ElMessageBox.confirm('登录状态已过期,请重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          clearAuthCache()
          location.href = '/login'
        })
      }

      const error = new Error(res.msg || '请求失败') as RequestError
      error.code = res.code
      return Promise.reject(error)
    }

    // 返回 data 字段
    return res.data
  },
  (error: AxiosError) => {
    console.error('响应错误:', error)

    let message = '网络连接失败'

    // 处理 HTTP 错误，不在这里弹窗，交由页面/Hook 统一显示，避免重复提示
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        message = '未授权，请重新登录'
        clearAuthCache()
        location.href = '/login'
      } else if (status === 403) {
        const backendMsg = (error.response.data as any)?.msg
        message = backendMsg || '没有权限访问，请联系管理员分配对应菜单权限'
      } else if (status === 500) {
        message = '服务器错误'
      } else {
        message = (error.response.data as any)?.msg || error.message || '网络错误'
      }
    } else {
      message = '网络连接失败'
    }

    const requestError = error as RequestError
    requestError.message = message
    return Promise.reject(requestError)
  }
)

// 封装请求方法
interface RequestOptions {
  url: string
  params?: any
  data?: any
  headers?: Record<string, string>
  onUploadProgress?: (progressEvent: any) => void
}

const buildHeaders = (options: RequestOptions) => {
  return {
    ...(options.headers || {})
  }
}

export default {
  get<T = any>(options: RequestOptions): Promise<T> {
    return service.get(options.url, {
      params: options.params,
      headers: buildHeaders(options)
    })
  },

  post<T = any>(options: RequestOptions): Promise<T> {
    return service.post(options.url, options.data, {
      headers: buildHeaders(options),
      onUploadProgress: options.onUploadProgress
    })
  },

  put<T = any>(options: RequestOptions): Promise<T> {
    return service.put(options.url, options.data, {
      headers: buildHeaders(options),
      onUploadProgress: options.onUploadProgress
    })
  },

  delete<T = any>(options: RequestOptions): Promise<T> {
    return service.delete(options.url, {
      params: options.params,
      headers: buildHeaders(options)
    })
  },

  download(options: RequestOptions): Promise<Blob> {
    return service.get(options.url, {
      params: options.params,
      responseType: 'blob'
    })
  },

  upload<T = any>(options: RequestOptions): Promise<T> {
    return service.post(options.url, options.data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options.headers || {})
      },
      onUploadProgress: options.onUploadProgress
    })
  }
}
