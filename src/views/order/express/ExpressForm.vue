<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="620px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="公司编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入公司编码（如 SF、YTO）" />
      </el-form-item>

      <el-form-item label="公司名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入物流公司名称" />
      </el-form-item>

      <el-form-item label="公司 Logo" prop="logo">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleUpload"
        >
          <img v-if="formData.logo" :src="formData.logo" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">启用</el-radio>
          <el-radio :value="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="formLoading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UploadRequestOptions } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useDialog } from '@/hooks/useDialog'
import * as ExpressApi from '@/api/order/express'
import type { ExpressVO } from '@/api/order/express'
import { uploadFile } from '@/api/infra/file'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const formData = ref<ExpressVO>({
  code: '',
  name: '',
  logo: '',
  sort: 0,
  status: 0
})

const formRules = {
  code: [
    { required: true, message: '请输入公司编码', trigger: 'blur' },
    { min: 2, max: 32, message: '公司编码长度在 2 到 32 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, max: 50, message: '公司名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const handleBeforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleUpload = async (options: UploadRequestOptions) => {
  try {
    const logoUrl = await uploadFile(options.file as File, 'express')
    formData.value.logo = logoUrl
    options.onSuccess?.(logoUrl as any)
  } catch (error: any) {
    ElMessage.error(error?.message || 'Logo 上传失败')
    options.onError?.(error)
  }
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type)
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const data = await ExpressApi.getExpress(id)
      formData.value = data
    } finally {
      formLoading.value = false
    }
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()

  await submit(async () => {
    if (formType.value === 'create') {
      return await ExpressApi.createExpress(formData.value)
    }
    return await ExpressApi.updateExpress(formData.value)
  })
}

const resetForm = () => {
  formData.value = {
    code: '',
    name: '',
    logo: '',
    sort: 0,
    status: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })
</script>

<style scoped lang="scss">
.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 148px;
  height: 148px;
  text-align: center;
  line-height: 148px;
}

.avatar {
  width: 148px;
  height: 148px;
  display: block;
  object-fit: cover;
}
</style>
