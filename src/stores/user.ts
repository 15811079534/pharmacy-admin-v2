import { defineStore } from 'pinia'
import { logout as logoutApi } from '@/api/auth'

interface UserState {
  token: string
  userInfo: any
  permissions: string[]
}

const USER_PERSIST_KEY = 'user'

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    permissions: []
  }),

  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
    },

    setPermissions(permissions: string[]) {
      this.permissions = permissions
    },

    clearAuthState() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
      localStorage.removeItem('token')
      localStorage.removeItem(USER_PERSIST_KEY)
    },

    async logout() {
      let remoteLogoutSuccess = true
      try {
        await logoutApi()
      } catch {
        remoteLogoutSuccess = false
      } finally {
        this.clearAuthState()
      }
      return remoteLogoutSuccess
    }
  },

  persist: true
})
