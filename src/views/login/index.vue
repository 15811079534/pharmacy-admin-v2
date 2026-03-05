<template>
  <div class="login-page">
    <div class="ambient ambient-1" />
    <div class="ambient ambient-2" />

    <div class="login-shell">
      <section class="brand-panel">
        <div class="brand-badge">
          <el-icon><FirstAidKit /></el-icon>
          <span>药房管理后台</span>
        </div>

        <h1>连锁药房数字化运营平台</h1>
        <p>
          聚焦药品流通、订单履约与会员服务，提供稳定可追踪的后台管理能力。
        </p>

        <ul class="feature-list">
          <li>
            <el-icon><DataAnalysis /></el-icon>
            <span>多模块实时运营总览</span>
          </li>
          <li>
            <el-icon><Goods /></el-icon>
            <span>药品库存与分类全链路管理</span>
          </li>
          <li>
            <el-icon><Van /></el-icon>
            <span>订单、售后、物流统一协同</span>
          </li>
        </ul>
      </section>

      <section class="form-panel">
        <el-card class="login-card" shadow="never">
          <div class="card-header">
            <h2>欢迎登录</h2>
            <p>请输入账号信息以继续访问后台系统</p>
          </div>

          <el-alert
            class="login-tip"
            type="info"
            :closable="false"
            title="默认管理员账号：admin / admin123"
          />

          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                autocomplete="username"
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                autocomplete="current-password"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item class="submit-item">
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-button"
                @click="handleLogin"
              >
                登录系统
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Lock,
  FirstAidKit,
  DataAnalysis,
  Goods,
  Van
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getPermissionInfo, login } from '@/api/auth'
import { hasMessageShown, markMessageShown } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await loginFormRef.value.validate()
  loading.value = true

  try {
    const res = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    userStore.setToken(res.accessToken)
    try {
      const permissionInfo = await getPermissionInfo()
      userStore.setUserInfo(permissionInfo.user || {})
      userStore.setPermissions(permissionInfo.permissions || [])
    } catch {
      userStore.setUserInfo({
        username: loginForm.username,
        nickname: loginForm.username
      })
    }

    ElMessage.success('登录成功')
    router.push('/home')
  } catch (error: any) {
    if (!hasMessageShown(error)) {
      ElMessage.error(error.message || '登录失败')
      markMessageShown(error)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
  background:
    linear-gradient(130deg, #07364d 0%, #0a5168 42%, #0b6a79 100%);
}

.ambient {
  position: absolute;
  border-radius: 999px;
  filter: blur(14px);
  pointer-events: none;
}

.ambient-1 {
  width: 360px;
  height: 360px;
  background: rgba(34, 211, 238, 0.36);
  top: -120px;
  right: -80px;
}

.ambient-2 {
  width: 320px;
  height: 320px;
  background: rgba(5, 150, 105, 0.22);
  left: -90px;
  bottom: -120px;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1040px, 100%);
  min-height: 620px;
  border-radius: 30px;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(212, 241, 245, 0.72);
  box-shadow: 0 30px 64px rgba(3, 43, 57, 0.34);
}

.brand-panel {
  background:
    radial-gradient(circle at 0% 0%, rgba(110, 231, 246, 0.45), transparent 40%),
    linear-gradient(145deg, #0f5f76, #0f4158 72%);
  color: #e8fdff;
  padding: 54px 42px;
  display: flex;
  flex-direction: column;
}

.brand-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 700;
  background: rgba(178, 239, 252, 0.16);
  border: 1px solid rgba(174, 238, 251, 0.3);
}

.brand-panel h1 {
  margin-top: 24px;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.25;
  letter-spacing: 0.01em;
}

.brand-panel p {
  margin-top: 18px;
  font-size: 15px;
  color: rgba(222, 248, 255, 0.88);
  line-height: 1.7;
}

.feature-list {
  margin-top: auto;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 24px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(209, 245, 255, 0.09);
  border: 1px solid rgba(187, 236, 248, 0.18);

  .el-icon {
    font-size: 18px;
    color: #98f1ff;
  }
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px;
  background: linear-gradient(180deg, #f8feff, #f1fbfd);
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 22px;
  border: 1px solid #d8edf2;
  background: rgba(255, 255, 255, 0.9);

  :deep(.el-card__body) {
    padding: 30px;
  }
}

.card-header h2 {
  font-size: 28px;
  color: #164e63;
  margin-bottom: 8px;
}

.card-header p {
  color: #5f8ea2;
  font-size: 14px;
  margin-bottom: 18px;
}

.login-tip {
  margin-bottom: 18px;
}

.login-form {
  .submit-item {
    margin-top: 8px;
  }
}

.login-button {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

@media (max-width: 992px) {
  .login-shell {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .brand-panel {
    padding: 30px 24px;
  }

  .feature-list {
    margin-top: 18px;
  }

  .form-panel {
    padding: 16px;
  }

  .login-card :deep(.el-card__body) {
    padding: 24px;
  }
}
</style>
