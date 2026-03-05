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
      <el-form-item label="门店名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入门店名称" />
      </el-form-item>
      <el-form-item label="门店地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入门店地址" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="营业时间" prop="businessHours">
        <el-input v-model="formData.businessHours" placeholder="如：08:00-22:00" />
      </el-form-item>
      <el-form-item label="配送范围" prop="deliveryRadius">
        <el-input-number
          v-model="formData.deliveryRadius"
          :min="0"
          :step="1"
          style="width: 100%"
        />
        <span style="margin-left: 10px">公里</span>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">营业中</el-radio>
          <el-radio :value="1">休息中</el-radio>
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
import { useDialog } from '@/hooks/useDialog'
import * as StoreApi from '@/api/pharmacy/store'
import type { StoreVO } from '@/api/pharmacy/store'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const formData = ref<StoreVO>({
  name: '',
  address: '',
  phone: '',
  businessHours: '',
  deliveryRadius: 3,
  status: 0
})

const formRules = {
  name: [
    { required: true, message: '请输入门店名称', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入门店地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  businessHours: [
    { required: true, message: '请输入营业时间', trigger: 'blur' }
  ],
  deliveryRadius: [
    { required: true, message: '请输入配送范围', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type)
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const data = await StoreApi.getStore(id)
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
      return await StoreApi.createStore(formData.value)
    } else {
      return await StoreApi.updateStore(formData.value)
    }
  })
}

const resetForm = () => {
  formData.value = {
    name: '',
    address: '',
    phone: '',
    businessHours: '',
    deliveryRadius: 3,
    status: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })
</script>
