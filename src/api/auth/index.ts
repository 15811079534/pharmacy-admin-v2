import request from '@/utils/request'

export interface LoginReqVO {
  username: string
  password: string
  remember?: boolean
}

export interface LoginResVO {
  accessToken: string
}

export interface PermissionInfoVO {
  user: {
    id: number
    username: string
    nickname: string
    avatar?: string
  }
  roles: string[]
  permissions: string[]
}

// 登录
export const login = (data: LoginReqVO) => {
  return request.post<LoginResVO>({
    url: '/system/auth/login',
    data
  })
}

// 登出
export const logout = () => {
  return request.post({
    url: '/system/auth/logout',
    data: {}
  })
}

// 获取用户权限信息
export const getPermissionInfo = () => {
  return request.get<PermissionInfoVO>({
    url: '/system/auth/get-permission-info'
  })
}
