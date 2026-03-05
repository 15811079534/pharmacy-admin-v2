<template>
  <div class="sidebar-container">
    <div class="brand-panel">
      <div class="brand-logo">
        <el-icon :size="22"><FirstAidKit /></el-icon>
      </div>
      <transition name="brand-fade">
        <div v-if="appStore.sidebarOpened" class="brand-text">
          <p class="title">药房管理后台</p>
          <p class="subtitle">医疗运营中台</p>
        </div>
      </transition>
    </div>

    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="!appStore.sidebarOpened"
        :unique-opened="true"
        router
        class="medical-menu"
      >
        <el-menu-item index="/home">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>运营总览</template>
        </el-menu-item>

        <el-sub-menu index="goods">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>药品管理</span>
          </template>
          <el-menu-item index="/goods/category">药品分类</el-menu-item>
          <el-menu-item index="/goods/goods">药品信息</el-menu-item>
          <el-menu-item index="/goods/stock">库存管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="order">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/order/order">订单列表</el-menu-item>
          <el-menu-item index="/order/aftersale">售后管理</el-menu-item>
          <el-menu-item index="/order/logistics">物流管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="pharmacy">
          <template #title>
            <el-icon><FirstAidKit /></el-icon>
            <span>医疗业务</span>
          </template>
          <el-menu-item index="/pharmacy/prescription">处方管理</el-menu-item>
          <el-menu-item index="/pharmacy/store">门店管理</el-menu-item>
          <el-menu-item index="/pharmacy/insurance">医保管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/member/member">
          <el-icon><User /></el-icon>
          <template #title>会员管理</template>
        </el-menu-item>

        <el-sub-menu index="marketing">
          <template #title>
            <el-icon><Promotion /></el-icon>
            <span>营销管理</span>
          </template>
          <el-menu-item index="/marketing/banner">轮播图</el-menu-item>
          <el-menu-item index="/marketing/notice">公告管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>

    <div v-if="appStore.sidebarOpened" class="sidebar-footer">
      <span class="dot" />
      <span>系统状态正常</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  DataAnalysis,
  Goods,
  ShoppingCart,
  FirstAidKit,
  User,
  Promotion
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()

const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #d8f6ff;
}

.brand-panel {
  height: 78px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-bottom: 1px solid rgba(199, 241, 255, 0.18);
  background: linear-gradient(130deg, rgba(20, 101, 125, 0.58), rgba(6, 73, 97, 0.24));
  gap: 10px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #22d3ee, #14b8a6);
  color: #073f52;
  box-shadow: 0 10px 20px rgba(0, 193, 218, 0.28);
  flex-shrink: 0;
}

.brand-text {
  min-width: 0;

  .title {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.01em;
    color: #ecfcff;
  }

  .subtitle {
    margin-top: 2px;
    font-size: 11px;
    color: rgba(216, 246, 255, 0.72);
  }
}

.menu-scroll {
  flex: 1;
  padding: 10px 0;
}

.medical-menu {
  border-right: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(224, 249, 255, 0.86);
  --el-menu-hover-bg-color: rgba(34, 211, 238, 0.12);
  --el-menu-active-color: #9cf2ff;
}

:deep(.medical-menu .el-menu-item),
:deep(.medical-menu .el-sub-menu__title) {
  height: 46px;
  border-radius: 12px;
  margin: 4px 10px;
  font-weight: 600;
  color: rgba(224, 249, 255, 0.88);
}

:deep(.medical-menu .el-menu-item .el-icon),
:deep(.medical-menu .el-sub-menu__title .el-icon) {
  width: 18px;
  margin-right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(193, 242, 255, 0.9);
}

:deep(.medical-menu .el-menu-item.is-active) {
  color: #ffffff;
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.3), rgba(16, 185, 129, 0.18));
  border-left: none !important;
}

:deep(.medical-menu .el-menu-item.is-active::before),
:deep(.medical-menu .el-sub-menu__title.is-active::before) {
  display: none !important;
}

:deep(.medical-menu .el-menu-item.is-active .el-icon) {
  color: #c4fff3;
}

:deep(.medical-menu .el-sub-menu .el-menu) {
  background: transparent;
}

:deep(.medical-menu.el-menu--collapse .el-sub-menu > .el-sub-menu__title),
:deep(.medical-menu.el-menu--collapse .el-menu-item) {
  margin: 4px 8px;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.medical-menu.el-menu--collapse .el-menu-item .el-menu-tooltip__trigger) {
  width: 100%;
  padding: 0 !important;
  justify-content: center;
}

:deep(.medical-menu.el-menu--collapse .el-sub-menu > .el-sub-menu__title .el-icon),
:deep(.medical-menu.el-menu--collapse .el-menu-item .el-icon) {
  width: 24px;
  margin: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  height: 44px;
  margin: 6px 12px 12px;
  border-radius: 12px;
  background: rgba(38, 201, 167, 0.12);
  color: rgba(224, 251, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.18);
}

.brand-fade-enter-active,
.brand-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.brand-fade-enter-from,
.brand-fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
