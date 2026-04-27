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

      <el-form-item label="商品品牌" prop="brandId">
        <el-select v-model="formData.brandId" placeholder="请选择品牌" style="width: 100%">
          <el-option
            v-for="item in brandList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

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

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="药品类型" prop="drugType">
            <el-select v-model="formData.drugType" placeholder="请选择药品类型" style="width: 100%">
              <el-option
                v-for="item in GoodsApi.DRUG_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="购买规则">
            <div class="purchase-rule-box">
              <el-tag :type="formData.prescriptionRequired ? 'danger' : 'success'">
                {{ formData.prescriptionRequired ? '先审方后购买' : '可直接购买' }}
              </el-tag>
              <div class="purchase-rule-hint">
                {{ formData.prescriptionRequired ? '处方药会在前台强制走处方审核闭环' : '非处方药可直接加入购物车和下单' }}
              </div>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="批准文号" prop="approvalNumber">
        <el-input
          v-model="formData.approvalNumber"
          placeholder="请输入国药准字/备案号，没有可留空"
        />
      </el-form-item>

      <el-form-item label="用药说明" prop="drugInstruction">
        <el-input
          v-model="formData.drugInstruction"
          type="textarea"
          :rows="3"
          placeholder="请输入用法用量、禁忌或购药提醒"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="GoodsApi.GOODS_VIEW_STATUS.ON_SHELF">上架</el-radio>
          <el-radio :value="GoodsApi.GOODS_VIEW_STATUS.OFF_SHELF">下架</el-radio>
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
import * as BrandApi from '@/api/goods/brand'
import * as CategoryApi from '@/api/goods/category'
import type { GoodsVO } from '@/api/goods/goods'
import type { BrandSimpleVO } from '@/api/goods/brand'
import type { CategoryVO } from '@/api/goods/category'
import { uploadFile } from '@/api/infra/file'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const categoryList = ref<Array<{ id: number; name: string }>>([])
const brandList = ref<BrandSimpleVO[]>([])

const formData = ref<GoodsVO>({
  name: '',
  categoryId: undefined as any,
  brandId: undefined as any,
  image: '',
  price: 0,
  stock: 0,
  status: GoodsApi.GOODS_VIEW_STATUS.ON_SHELF,
  description: '',
  drugType: GoodsApi.DRUG_TYPE.GENERAL,
  prescriptionRequired: false,
  approvalNumber: '',
  drugInstruction: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入药品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '药品名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择药品分类', trigger: 'change' }
  ],
  brandId: [
    { required: true, message: '请选择商品品牌', trigger: 'change' }
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
  drugType: [
    { required: true, message: '请选择药品类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

watch(
  () => formData.value.drugType,
  (drugType) => {
    formData.value.prescriptionRequired = Number(drugType) === GoodsApi.DRUG_TYPE.RX
  },
  { immediate: true }
)

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

const loadBrandList = async (showEmptyHint = false) => {
  try {
    brandList.value = await BrandApi.getBrandSimpleList()
    if (showEmptyHint && !brandList.value.length) {
      ElMessage.warning('请先在商品品牌中创建并启用至少一个品牌')
    }
  } catch (error) {
    brandList.value = []
    ElMessage.error('获取商品品牌失败')
  }
}

const ensureBrandOption = (brandId?: number) => {
  if (!brandId) return
  if (brandList.value.some((item) => item.id === brandId)) return
  brandList.value = [{ id: brandId, name: `品牌#${brandId}` }, ...brandList.value]
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type)
  resetForm()
  await Promise.all([loadCategoryList(), loadBrandList(true)])

  const firstBrandId = brandList.value[0]?.id
  if (type === 'create' && !formData.value.brandId && firstBrandId !== undefined) {
    formData.value.brandId = firstBrandId
  }

  if (id) {
    formLoading.value = true
    try {
      const data = await GoodsApi.getGoods(id)
      formData.value = data
      ensureBrandOption(formData.value.brandId)
      const fallbackBrandId = brandList.value[0]?.id
      if (!formData.value.brandId && fallbackBrandId !== undefined) {
        formData.value.brandId = fallbackBrandId
      }
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
    brandId: undefined as any,
    image: '',
    price: 0,
    stock: 0,
    status: GoodsApi.GOODS_VIEW_STATUS.ON_SHELF,
    description: '',
    drugType: GoodsApi.DRUG_TYPE.GENERAL,
    prescriptionRequired: false,
    approvalNumber: '',
    drugInstruction: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })

onMounted(() => {
  Promise.all([loadCategoryList(), loadBrandList()])
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

.purchase-rule-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.purchase-rule-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
