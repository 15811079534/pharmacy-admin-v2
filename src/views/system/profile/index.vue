<template>
  <div class="app-container">
    <PageHero
      title="个人中心"
      description="统一维护账号资料、联系方式与基础档案，确保通知触达和审计信息准确。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>账号资料</span>
          <el-tag type="success" effect="plain">实时同步</el-tag>
        </div>
      </template>

      <el-form
        ref="formRef"
        v-loading="loading"
        :model="formData"
        :rules="rules"
        label-width="92px"
        class="profile-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="账号">
              <el-input :model-value="profile.username || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="formData.nickname" maxlength="30" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="formData.mobile" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="性别" prop="sex">
              <el-radio-group v-model="formData.sex">
                <el-radio :value="0">未知</el-radio>
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="头像地址" prop="avatar">
              <el-input v-model="formData.avatar" placeholder="https://..." />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>登录信息</el-divider>

        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="部门">
              <el-input :model-value="profile.dept?.name || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="角色">
              <el-input :model-value="rolesText" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="登录 IP">
              <el-input :model-value="profile.loginIp || '-'" disabled />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="登录时间">
              <el-input :model-value="profile.loginDate || '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="actions">
        <el-button @click="loadProfile">刷新</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存资料</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import PageHero from '@/components/PageHero.vue'
import { useUserStore } from '@/stores/user'
import {
  getUserProfile,
  updateUserProfile,
  type UserProfileUpdateReqVO,
  type UserProfileVO
} from '@/api/system/profile'

const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)

const profile = reactive<UserProfileVO>({
  id: 0,
  username: '',
  nickname: '',
  email: '',
  mobile: '',
  sex: 0,
  avatar: '',
  loginIp: '',
  loginDate: '',
  createTime: '',
  dept: undefined,
  roles: [],
  posts: []
})

const formData = reactive<UserProfileUpdateReqVO>({
  nickname: '',
  mobile: '',
  email: '',
  sex: 0,
  avatar: ''
})

const rolesText = computed(() => {
  const roles = profile.roles || []
  if (!roles.length) return '-'
  return roles.map((item) => item.name).join(' / ')
})

const heroStats = computed(() => [
  {
    label: '当前账号',
    value: profile.username || '-',
    helper: '登录身份',
    tone: 'primary'
  },
  {
    label: '所属部门',
    value: profile.dept?.name || '-',
    helper: '组织信息',
    tone: 'info'
  },
  {
    label: '角色数量',
    value: profile.roles?.length || 0,
    helper: rolesText.value === '-' ? '暂无角色' : rolesText.value,
    tone: 'success'
  }
])

const rules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  mobile: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        if (!/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error('请输入正确的手机号'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  email: [
    {
      type: 'email',
      message: '邮箱格式不正确',
      trigger: ['blur', 'change']
    }
  ]
}

const loadProfile = async () => {
  loading.value = true
  try {
    const data = await getUserProfile()
    Object.assign(profile, {
      id: 0,
      username: '',
      nickname: '',
      email: '',
      mobile: '',
      sex: 0,
      avatar: '',
      loginIp: '',
      loginDate: '',
      createTime: '',
      dept: undefined,
      roles: [],
      posts: []
    })
    if (data) {
      Object.assign(profile, data)
    }

    Object.assign(formData, {
      nickname: data?.nickname || '',
      mobile: data?.mobile || '',
      email: data?.email || '',
      sex: data?.sex ?? 0,
      avatar: data?.avatar || ''
    })
  } catch (error: any) {
    ElMessage.error(error?.message || '获取个人资料失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  saving.value = true
  try {
    await updateUserProfile(formData)
    userStore.setUserInfo({
      ...(userStore.userInfo || {}),
      nickname: formData.nickname,
      avatar: formData.avatar
    })
    ElMessage.success('资料更新成功')
    await loadProfile()
  } catch (error: any) {
    ElMessage.error(error?.message || '资料更新失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-form {
  :deep(.el-divider__text) {
    font-size: 13px;
    color: #4f7484;
  }
}

.actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
