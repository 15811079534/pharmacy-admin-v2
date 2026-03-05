<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-alert
      type="info"
      :closable="false"
      title="密码长度需为 4-16 位，建议包含字母和数字。"
      class="dialog-tip"
    />

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      v-loading="saving"
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input v-model="formData.oldPassword" type="password" show-password clearable />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="formData.newPassword" type="password" show-password clearable />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" type="password" show-password clearable />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { updateUserPassword } from '@/api/system/profile'

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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

const resetState = () => {
  formData.oldPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
}

const open = () => {
  resetState()
  dialogVisible.value = true
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
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.dialog-tip {
  margin-bottom: 16px;
}
</style>
