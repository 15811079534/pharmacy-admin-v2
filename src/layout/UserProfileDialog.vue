<template>
  <el-dialog
    v-model="dialogVisible"
    title="个人中心"
    width="680px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-width="92px"
      class="profile-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="账号">
            <el-input :model-value="profile.username || '-'" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="formData.nickname" maxlength="30" show-word-limit />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="formData.mobile" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="性别" prop="sex">
            <el-radio-group v-model="formData.sex">
              <el-radio :value="0">未知</el-radio>
              <el-radio :value="1">男</el-radio>
              <el-radio :value="2">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="头像地址" prop="avatar">
            <el-input v-model="formData.avatar" placeholder="https://..." />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>登录信息</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="部门">
            <el-input :model-value="profile.dept?.name || '-'" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="角色">
            <el-input :model-value="rolesText" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="登录 IP">
            <el-input :model-value="profile.loginIp || '-'" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录时间">
            <el-input :model-value="profile.loginDate || '-'" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import {
  getUserProfile,
  updateUserProfile,
  type UserProfileUpdateReqVO,
  type UserProfileVO
} from '@/api/system/profile'

const emit = defineEmits<{
  success: [payload: { nickname?: string; avatar?: string }]
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const profile = reactive<UserProfileVO>({
  id: 0,
  username: '',
  nickname: ''
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

const resetState = () => {
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
  Object.assign(formData, {
    nickname: '',
    mobile: '',
    email: '',
    sex: 0,
    avatar: ''
  })
}

const loadProfile = async () => {
  loading.value = true
  try {
    const data = await getUserProfile()
    Object.assign(profile, data || {})
    Object.assign(formData, {
      nickname: data?.nickname || '',
      mobile: data?.mobile || '',
      email: data?.email || '',
      sex: data?.sex ?? 0,
      avatar: data?.avatar || ''
    })
  } finally {
    loading.value = false
  }
}

const open = async () => {
  dialogVisible.value = true
  resetState()
  await loadProfile()
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  saving.value = true
  try {
    await updateUserProfile(formData)
    ElMessage.success('资料更新成功')
    emit('success', {
      nickname: formData.nickname,
      avatar: formData.avatar
    })
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.profile-form {
  :deep(.el-divider__text) {
    font-size: 13px;
    color: #4f7484;
  }
}
</style>
