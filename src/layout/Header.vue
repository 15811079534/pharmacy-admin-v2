<template>
  <div class="header-container">
    <div class="header-left">
      <el-button class="toggle-btn" text circle @click="toggleSidebar">
        <el-icon :size="18">
          <Fold v-if="appStore.sidebarOpened" />
          <Expand v-else />
        </el-icon>
      </el-button>

      <div class="title-group" :class="{ compact: !breadcrumbItems.length }">
        <p class="page-title">{{ pageTitle }}</p>
        <el-breadcrumb v-if="breadcrumbItems.length" separator="/" class="breadcrumb">
          <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item">
            {{ item }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="header-right">
      <div class="status-pill">
        <span class="dot" />
        API 正常
      </div>

      <div class="date-pill">{{ currentTime }}</div>

      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" class="avatar" :src="userStore.userInfo?.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-meta">
            <span class="name">{{ userStore.userInfo?.nickname || '管理员' }}</span>
            <span class="role">系统管理员</span>
          </div>
          <el-icon class="down-icon"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Fold,
  Expand,
  User,
  ArrowDown,
  Lock,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const isHome = computed(() => route.path === '/home')
const pageTitle = computed(() => (route.meta.title as string) || '运营总览')
const breadcrumbItems = computed(() => (isHome.value ? [] : ['首页', pageTitle.value]))

const formatTime = () =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date())

const currentTime = ref(formatTime())
let timer: number

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      await router.push('/system/profile')
      break
    case 'password':
      await router.push('/system/password')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const remoteLogoutSuccess = await userStore.logout()
        if (remoteLogoutSuccess) {
          ElMessage.success('退出成功')
        } else {
          ElMessage.warning('已退出本地登录（服务端登出失败）')
        }
        await router.replace('/login')
      } catch {
        // 用户取消退出
      }
      break
  }
}

onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = formatTime()
  }, 30000)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
})
</script>

<style scoped lang="scss">
.header-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toggle-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid #d0e9ef;
  background: linear-gradient(160deg, #f8fdff, #edf8fb);
  color: #286177;

  &:hover {
    color: #0a869e;
    border-color: #9fdae4;
  }
}

.title-group {
  min-width: 0;
}

.page-title {
  font-size: 17px;
  font-weight: 800;
  color: #184f64;
  margin-bottom: 2px;
  white-space: nowrap;
}

.breadcrumb {
  font-size: 11px;
}

.title-group.compact .page-title {
  margin-bottom: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-pill,
.date-pill {
  height: 30px;
  border-radius: 999px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.status-pill {
  color: #0f6f73;
  border: 1px solid #b7e5d8;
  background: rgba(16, 185, 129, 0.1);
  gap: 7px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
}

.date-pill {
  color: #3b7287;
  border: 1px solid #d6edf2;
  background: #f4fbfd;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 3px 6px 3px 3px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 220ms ease;

  &:hover {
    border-color: #d0e9ef;
    background: #f7fdff;
  }
}

.avatar {
  border: 2px solid #d6eef3;
  color: #177086;
  background: #f2fbfe;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
}

.name {
  font-size: 13px;
  font-weight: 700;
  color: #174f64;
}

.role {
  font-size: 11px;
  color: #6a97a9;
}

.down-icon {
  color: #70a3b5;
}

@media (max-width: 992px) {
  .breadcrumb,
  .date-pill,
  .status-pill,
  .role,
  .down-icon {
    display: none;
  }

  .page-title {
    margin-bottom: 0;
    font-size: 16px;
  }

  .user-info {
    padding: 0;
    border: none;
    background: transparent;
  }
}
</style>
