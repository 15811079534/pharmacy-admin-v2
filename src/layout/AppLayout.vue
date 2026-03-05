<template>
  <div
    class="layout-shell"
    :class="{
      'is-mobile': isMobile,
      'is-sidebar-open': appStore.sidebarOpened
    }"
  >
    <div class="layout-backdrop" />

    <el-container class="app-layout">
      <el-aside
        :width="sidebarWidth"
        class="sidebar"
        :class="{ collapsed: !appStore.sidebarOpened && !isMobile }"
      >
        <Sidebar />
      </el-aside>

      <el-container class="layout-main">
        <el-header class="header">
          <Header />
        </el-header>

        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>

    <div
      v-if="isMobile && appStore.sidebarOpened"
      class="mobile-mask"
      @click="appStore.closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const appStore = useAppStore()

const isMobile = computed(() => appStore.device === 'mobile')
const sidebarWidth = computed(() =>
  isMobile.value ? '260px' : appStore.sidebarOpened ? '248px' : '84px'
)

const syncDevice = () => {
  const mobile = window.innerWidth < 992
  appStore.setDevice(mobile ? 'mobile' : 'desktop')

  if (mobile && appStore.sidebarOpened) {
    appStore.closeSidebar()
  }
}

onMounted(() => {
  syncDevice()
  window.addEventListener('resize', syncDevice)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncDevice)
})
</script>

<style scoped lang="scss">
.layout-shell {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.layout-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 92% -4%, rgba(34, 211, 238, 0.2), transparent 30%),
    radial-gradient(circle at 0% 100%, rgba(5, 150, 105, 0.08), transparent 36%);
}

.app-layout {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
  background: transparent;
}

.sidebar {
  margin: 14px 0 14px 14px;
  border-radius: 22px;
  background: linear-gradient(180deg, #0d3b4f 0%, #12485f 40%, #0f3447 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 40px rgba(9, 71, 97, 0.32);
  overflow: hidden;
  transition: width 260ms ease, transform 260ms ease;
}

.layout-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.header {
  height: 64px;
  margin: 10px 12px 0;
  border-radius: 14px;
  border: 1px solid #d8eef3;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  padding: 0 14px;
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow-y: auto;
}

.layout-shell.is-mobile .sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  margin: 0;
  border-radius: 0 20px 20px 0;
  z-index: 1200;
  transform: translateX(-100%);
}

.layout-shell.is-mobile.is-sidebar-open .sidebar {
  transform: translateX(0);
}

.layout-shell.is-mobile .header {
  margin: 8px;
  padding: 0 12px;
}

.layout-shell.is-mobile .main-content {
  padding: 8px;
}

.mobile-mask {
  position: fixed;
  inset: 0;
  background: rgba(13, 44, 59, 0.36);
  z-index: 1100;
}

@media (max-width: 992px) {
  .header {
    height: 56px;
  }
}
</style>
