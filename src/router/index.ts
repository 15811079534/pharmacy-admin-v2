import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AppLayout from '@/layout/AppLayout.vue'

// 基础路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页' }
      },
      // 药品管理
      {
        path: 'goods/category',
        name: 'GoodsCategory',
        component: () => import('@/views/goods/category/index.vue'),
        meta: { title: '药品分类' }
      },
      {
        path: 'goods/goods',
        name: 'GoodsGoods',
        component: () => import('@/views/goods/goods/index.vue'),
        meta: { title: '药品信息' }
      },
      {
        path: 'goods/stock',
        name: 'GoodsStock',
        component: () => import('@/views/goods/stock/index.vue'),
        meta: { title: '库存管理' }
      },
      // 订单管理
      {
        path: 'order/order',
        name: 'OrderOrder',
        component: () => import('@/views/order/order/index.vue'),
        meta: { title: '订单列表' }
      },
      {
        path: 'order/aftersale',
        name: 'OrderAftersale',
        component: () => import('@/views/order/aftersale/index.vue'),
        meta: { title: '售后管理' }
      },
      {
        path: 'order/logistics',
        name: 'OrderLogistics',
        component: () => import('@/views/order/logistics/index.vue'),
        meta: { title: '物流管理' }
      },
      // 医疗业务
      {
        path: 'pharmacy/prescription',
        name: 'PharmacyPrescription',
        component: () => import('@/views/pharmacy/prescription/index.vue'),
        meta: { title: '处方管理' }
      },
      {
        path: 'pharmacy/store',
        name: 'PharmacyStore',
        component: () => import('@/views/pharmacy/store/index.vue'),
        meta: { title: '门店管理' }
      },
      {
        path: 'pharmacy/insurance',
        name: 'PharmacyInsurance',
        component: () => import('@/views/pharmacy/insurance/index.vue'),
        meta: { title: '医保管理' }
      },
      // 会员管理
      {
        path: 'member/member',
        name: 'MemberMember',
        component: () => import('@/views/member/member/index.vue'),
        meta: { title: '会员列表' }
      },
      // 营销管理
      {
        path: 'marketing/banner',
        name: 'MarketingBanner',
        component: () => import('@/views/marketing/banner/index.vue'),
        meta: { title: '轮播图管理' }
      },
      {
        path: 'marketing/notice',
        name: 'MarketingNotice',
        component: () => import('@/views/marketing/notice/index.vue'),
        meta: { title: '公告管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

// 路由守卫
router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.path === '/login') {
    return true
  }
  if (userStore.token) {
    return true
  }
  return '/login'
})

export default router
