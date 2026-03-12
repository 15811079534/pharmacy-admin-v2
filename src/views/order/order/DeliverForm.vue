<template>
  <el-dialog
    v-model="dialogVisible"
    title="订单发货"
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
      <el-form-item label="物流公司" prop="logisticsId">
        <el-select
          v-model="formData.logisticsId"
          placeholder="请选择物流公司"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="item in expressList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="物流单号" prop="trackingNo">
        <el-input v-model="formData.trackingNo" placeholder="请输入物流单号" />
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
import * as OrderApi from '@/api/order/order'

const emit = defineEmits(['success'])

const { dialogVisible, formLoading, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const orderId = ref<number>()
const expressList = ref<OrderApi.ExpressCompanyVO[]>([])

const formData = ref({
  logisticsId: undefined as number | undefined,
  trackingNo: ''
})

const formRules = {
  logisticsId: [
    { required: true, message: '请选择物流公司', trigger: 'change' }
  ],
  trackingNo: [
    { required: true, message: '请输入物流单号', trigger: 'blur' }
  ]
}

const open = (id: number) => {
  orderId.value = id
  dialogVisible.value = true
  resetForm()
  loadExpressList()
}

const handleSubmit = async () => {
  await formRef.value.validate()

  const logisticsId = formData.value.logisticsId
  if (!logisticsId) {
    ElMessage.warning('请选择物流公司')
    return
  }

  await submit(async () => {
    return await OrderApi.deliverOrder({
      id: orderId.value!,
      logisticsId,
      trackingNo: formData.value.trackingNo
    })
  }, '发货成功')
}

const loadExpressList = async () => {
  try {
    expressList.value = await OrderApi.getExpressCompanyList()
    if (!expressList.value.length) {
      ElMessage.warning('未配置物流公司，请先前往订单管理-物流公司创建')
    }
  } catch (error) {
    ElMessage.error('获取物流公司失败')
  }
}

const resetForm = () => {
  formData.value = {
    logisticsId: undefined,
    trackingNo: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
