import { defineStore } from 'pinia'

interface AppState {
  sidebarOpened: boolean
  device: 'desktop' | 'mobile'
  size: 'default' | 'large' | 'small'
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarOpened: true,
    device: 'desktop',
    size: 'default'
  }),

  actions: {
    toggleSidebar() {
      this.sidebarOpened = !this.sidebarOpened
    },

    closeSidebar() {
      this.sidebarOpened = false
    },

    setDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },

    setSize(size: 'default' | 'large' | 'small') {
      this.size = size
    }
  },

  persist: true
})
