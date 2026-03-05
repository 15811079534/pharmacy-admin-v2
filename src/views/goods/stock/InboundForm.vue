<template>
  <el-dialog
    v-model="dialogVisible"
    title="药品入库"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="选择药品" prop="goodsId">
        <el-select
          v-model="formData.goodsId"
          placeholder="请选择药品"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="item in goodsList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="入库数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :min="1"
          :step="1"
          style="width: 100%"
          placeholder="请输入入库数量"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息（选填）"
          maxlength="200"
          show-word-limit
        />
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
import { useDialog } from '@/hooks/useDialog'
import * as StockApi from '@/api/goods/stock'
import type { InboundStockReqVO } from '@/api/goods/stock'

const emit = defineEmits(['success'])

const { dialogVisible, formLoading, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const goodsList = ref<{ id: number; name: string }[]>([])

const formData = ref<InboundStockReqVO>({
  goodsId: undefined as any,
  quantity: 1,
  remark: ''
})

const formRules = {
  goodsId: [
    { required: true, message: '请选择药品', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入入库数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '入库数量必须大于0', trigger: 'blur' }
  ]
}

const open = async (goodsId?: number) => {
  dialogVisible.value = true
  resetForm()

  if (goodsId) {
    formData.value.goodsId = goodsId
  }

  try {
    goodsList.value = await StockApi.getGoodsList()
  } catch (error) {
    ElMessage.error('获取药品列表失败')
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()

  await submit(async () => {
    return await StockApi.inboundStock(formData.value)
  }, '入库成功')
}

const resetForm = () => {
  formData.value = {
    goodsId: undefined as any,
    quantity: 1,
    remark: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
