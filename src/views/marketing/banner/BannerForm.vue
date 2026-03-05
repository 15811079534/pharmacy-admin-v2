<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入轮播图标题" />
      </el-form-item>

      <el-form-item label="图片" prop="image">
        <el-upload
          class="banner-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleUpload"
        >
          <img v-if="formData.image" :src="formData.image" class="banner-image" />
          <el-icon v-else class="banner-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">建议尺寸：750x375，支持jpg、png格式，大小不超过2MB</div>
      </el-form-item>

      <el-form-item label="链接类型" prop="linkType">
        <el-radio-group v-model="formData.linkType">
          <el-radio :value="1">商品</el-radio>
          <el-radio :value="2">页面</el-radio>
          <el-radio :value="3">外链</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="链接值" prop="linkValue">
        <el-input
          v-model="formData.linkValue"
          :placeholder="getLinkValuePlaceholder()"
        />
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
import * as BannerApi from '@/api/marketing/banner'
import type { BannerVO } from '@/api/marketing/banner'
import { uploadFile } from '@/api/infra/file'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const formData = ref<BannerVO>({
  title: '',
  image: '',
  linkType: 1,
  linkValue: '',
  sort: 0,
  status: 0
})

const formRules = {
  title: [
    { required: true, message: '请输入轮播图标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  image: [
    { required: true, message: '请上传轮播图图片', trigger: 'change' }
  ],
  linkType: [
    { required: true, message: '请选择链接类型', trigger: 'change' }
  ],
  linkValue: [
    { required: true, message: '请输入链接值', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
    { type: 'number', min: 0, message: '排序必须大于等于0', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const getLinkValuePlaceholder = () => {
  const placeholders = {
    1: '请输入商品ID',
    2: '请输入页面路径',
    3: '请输入外链地址'
  }
  return placeholders[formData.value.linkType as keyof typeof placeholders] || '请输入链接值'
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
    const imageUrl = await uploadFile(options.file as File, 'banner')
    formData.value.image = imageUrl
    options.onSuccess?.(imageUrl as any)
  } catch (error: any) {
    ElMessage.error(error?.message || '轮播图上传失败')
    options.onError?.(error)
  }
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type)
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const data = await BannerApi.getBanner(id)
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
      return await BannerApi.createBanner(formData.value)
    } else {
      return await BannerApi.updateBanner(formData.value)
    }
  })
}

const resetForm = () => {
  formData.value = {
    title: '',
    image: '',
    linkType: 1,
    linkValue: '',
    sort: 0,
    status: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })
</script>

<style scoped lang="scss">
.banner-uploader {
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

.banner-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 360px;
  height: 180px;
  text-align: center;
  line-height: 180px;
}

.banner-image {
  width: 360px;
  height: 180px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
