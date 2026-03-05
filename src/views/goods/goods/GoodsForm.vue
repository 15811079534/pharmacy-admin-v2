<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="药品名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入药品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="药品分类" prop="categoryId">
            <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
              <el-option
                v-for="item in categoryList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="价格" prop="price">
            <el-input-number
              v-model="formData.price"
              :min="0"
              :precision="2"
              :step="0.1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="库存" prop="stock">
            <el-input-number
              v-model="formData.stock"
              :min="0"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="主图" prop="image">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleUpload"
        >
          <img v-if="formData.image" :src="formData.image" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item label="商品描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入商品描述"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">上架</el-radio>
          <el-radio :value="1">下架</el-radio>
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
import * as GoodsApi from '@/api/goods/goods'
import * as CategoryApi from '@/api/goods/category'
import type { GoodsVO } from '@/api/goods/goods'
import type { CategoryVO } from '@/api/goods/category'
import { uploadFile } from '@/api/infra/file'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const categoryList = ref<Array<{ id: number; name: string }>>([])

const formData = ref<GoodsVO>({
  name: '',
  categoryId: undefined as any,
  image: '',
  price: 0,
  stock: 0,
  status: 0,
  description: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入药品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '药品名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择药品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格必须大于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存必须大于等于0', trigger: 'blur' }
  ],
  image: [
    { required: true, message: '请上传主图', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
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
    const imageUrl = await uploadFile(options.file as File, 'goods')
    formData.value.image = imageUrl
    options.onSuccess?.(imageUrl as any)
  } catch (error: any) {
    ElMessage.error(error?.message || '图片上传失败')
    options.onError?.(error)
  }
}

const flattenCategories = (list: CategoryVO[], fallbackParentId = 0): CategoryVO[] => {
  const result: CategoryVO[] = []
  ;(list || []).forEach((item) => {
    const current: CategoryVO = {
      ...item,
      parentId: item.parentId ?? fallbackParentId
    }
    result.push(current)
    if (item.children?.length) {
      result.push(...flattenCategories(item.children, item.id || 0))
    }
  })
  return result
}

const collectSelectableCategories = (tree: CategoryVO[]): Array<{ id: number; name: string }> => {
  const all = flattenCategories(tree)
  const byId = new Map<number, CategoryVO>()
  const parentWithChildren = new Set<number>()

  all.forEach((item) => {
    if (item.id) {
      byId.set(item.id, item)
      if (item.parentId && item.parentId > 0) {
        parentWithChildren.add(item.parentId)
      }
    }
  })

  const getDepth = (id: number) => {
    let depth = 1
    let current = byId.get(id)
    const visited = new Set<number>([id])
    while (current?.parentId && current.parentId > 0 && !visited.has(current.parentId)) {
      visited.add(current.parentId)
      depth += 1
      current = byId.get(current.parentId)
    }
    return depth
  }

  const getPath = (id: number) => {
    const names: string[] = []
    let current = byId.get(id)
    const visited = new Set<number>()
    while (current?.id && !visited.has(current.id)) {
      visited.add(current.id)
      names.push(current.name)
      if (!current.parentId || current.parentId <= 0) break
      current = byId.get(current.parentId)
    }
    return names.reverse().join(' / ')
  }

  return all
    .filter((item) => item.id && item.status === 0)
    .filter((item) => !parentWithChildren.has(item.id!))
    .filter((item) => getDepth(item.id!) >= 2)
    .map((item) => ({
      id: item.id!,
      name: getPath(item.id!)
    }))
}

const loadCategoryList = async () => {
  try {
    const tree = await CategoryApi.getCategoryList({})
    categoryList.value = collectSelectableCategories(tree)
  } catch (error) {
    categoryList.value = []
    ElMessage.error('获取药品分类失败')
  }
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type)
  resetForm()
  await loadCategoryList()

  if (id) {
    formLoading.value = true
    try {
      const data = await GoodsApi.getGoods(id)
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
      return await GoodsApi.createGoods(formData.value)
    } else {
      return await GoodsApi.updateGoods(formData.value)
    }
  })
}

const resetForm = () => {
  formData.value = {
    name: '',
    categoryId: undefined as any,
    image: '',
    price: 0,
    stock: 0,
    status: 0,
    description: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })

onMounted(() => {
  loadCategoryList()
})
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
