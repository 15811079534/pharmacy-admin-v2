<template>
  <el-dialog
    v-model="dialogVisible"
    title="更新物流信息"
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
import * as LogisticsApi from '@/api/order/logistics'

const emit = defineEmits(['success'])

const { dialogVisible, formLoading, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const logisticsId = ref<number>()
const expressList = ref<Array<{ id: number; name: string }>>([])

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

const open = async (id: number) => {
  logisticsId.value = id
  dialogVisible.value = true
  await loadExpressList()
  await loadData()
}

const loadExpressList = async () => {
  try {
    expressList.value = await LogisticsApi.getExpressCompanyList()
    if (!expressList.value.length) {
      ElMessage.warning('未配置物流公司，请先在后端维护物流公司')
    }
  } catch (error) {
    ElMessage.error('获取物流公司失败')
  }
}

const loadData = async () => {
  formLoading.value = true

  try {
    const data = await LogisticsApi.getLogistics(logisticsId.value!)
    formData.value = {
      logisticsId: data.logisticsId,
      trackingNo: data.trackingNo
    }
  } catch (error) {
    ElMessage.error('获取物流信息失败')
  } finally {
    formLoading.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()

  await submit(async () => {
    return await LogisticsApi.updateLogistics({
      id: logisticsId.value!,
      ...formData.value
    })
  }, '更新成功')
}

defineExpose({ open })
</script>
