<template>
  <div class="app-container">
    <PageHero
      title="修改密码"
      description="定期更新账号密码，降低凭据泄露风险，确保后台账号安全。"
      :stats="heroStats"
    />

    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>密码设置</span>
          <el-tag type="warning" effect="plain">安全操作</el-tag>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        title="密码长度需为 4-16 位，建议同时包含字母、数字和符号。"
        class="tips"
      />

      <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px" class="password-form">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="formData.oldPassword" type="password" show-password clearable />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="formData.newPassword" type="password" show-password clearable />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="formData.confirmPassword" type="password" show-password clearable />
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确认修改</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import PageHero from '@/components/PageHero.vue'
import { useUserStore } from '@/stores/user'
import { updateUserPassword } from '@/api/system/profile'

const userStore = useUserStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const heroStats = computed(() => [
  {
    label: '当前用户',
    value: userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员',
    helper: '修改后立即生效',
    tone: 'primary'
  },
  {
    label: '密码策略',
    value: '4-16 位',
    helper: '至少区分大小写',
    tone: 'info'
  },
  {
    label: '安全建议',
    value: '定期更新',
    helper: '建议每 90 天更换',
    tone: 'warning'
  }
])

const rules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' },
    { min: 4, max: 16, message: '密码长度需为 4-16 位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 4, max: 16, message: '密码长度需为 4-16 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== formData.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const resetForm = () => {
  formData.oldPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  if (formData.oldPassword === formData.newPassword) {
    ElMessage.warning('新密码不能与旧密码相同')
    return
  }

  saving.value = true
  try {
    await updateUserPassword(formData.oldPassword, formData.newPassword)
    ElMessage.success('密码修改成功')
    resetForm()
  } catch (error: any) {
    ElMessage.error(error?.message || '密码修改失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips {
  margin-bottom: 16px;
}

.password-form {
  max-width: 560px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
