import request from '@/utils/request'

export interface UserProfileVO {
  id: number
  username: string
  nickname: string
  email?: string
  mobile?: string
  sex?: number
  avatar?: string
  loginIp?: string
  loginDate?: string
  createTime?: string
  dept?: {
    id: number
    name: string
  }
  roles?: Array<{
    id: number
    name: string
  }>
  posts?: Array<{
    id: number
    name: string
  }>
}

export interface UserProfileUpdateReqVO {
  nickname?: string
  email?: string
  mobile?: string
  sex?: number
  avatar?: string
}

// 获取当前登录用户资料
export const getUserProfile = () => {
  return request.get<UserProfileVO>({
    url: '/system/user/profile/get'
  })
}

// 更新当前登录用户资料
export const updateUserProfile = (data: UserProfileUpdateReqVO) => {
  return request.put<boolean>({
    url: '/system/user/profile/update',
    data
  })
}

// 修改当前登录用户密码
export const updateUserPassword = (oldPassword: string, newPassword: string) => {
  return request.put<boolean>({
    url: '/system/user/profile/update-password',
    data: {
      oldPassword,
      newPassword
    }
  })
}
