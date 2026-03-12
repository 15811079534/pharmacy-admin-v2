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
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="等级名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入等级名称" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="等级值" prop="level">
            <el-input-number v-model="formData.level" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="升级经验" prop="experience">
            <el-input-number v-model="formData.experience" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="折扣(%)" prop="discountPercent">
        <el-input-number
          v-model="formData.discountPercent"
          :min="0"
          :max="100"
          :precision="0"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="等级图标" prop="icon">
        <el-input v-model="formData.icon" placeholder="请输入图标 URL（可选）" />
      </el-form-item>

      <el-form-item label="背景图" prop="backgroundUrl">
        <el-input v-model="formData.backgroundUrl" placeholder="请输入背景图 URL（可选）" />
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
import { useDialog } from '@/hooks/useDialog'
import * as MemberLevelApi from '@/api/member/level'
import type { MemberLevelVO } from '@/api/member/level'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const formData = ref<MemberLevelVO>({
  name: '',
  level: 1,
  experience: 1,
  discountPercent: 100,
  icon: '',
  backgroundUrl: '',
  status: 0
})

const formRules = {
  name: [
    { required: true, message: '请输入等级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '等级名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  level: [
    { required: true, message: '请输入等级值', trigger: 'blur' },
    { type: 'number', min: 1, message: '等级值必须大于 0', trigger: 'blur' }
  ],
  experience: [
    { required: true, message: '请输入升级经验', trigger: 'blur' },
    { type: 'number', min: 1, message: '升级经验必须大于 0', trigger: 'blur' }
  ],
  discountPercent: [
    { required: true, message: '请输入折扣', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '折扣范围为 0 到 100', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type)
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const data = await MemberLevelApi.getMemberLevel(id)
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
      return await MemberLevelApi.createMemberLevel(formData.value)
    }
    return await MemberLevelApi.updateMemberLevel(formData.value)
  })
}

const resetForm = () => {
  formData.value = {
    name: '',
    level: 1,
    experience: 1,
    discountPercent: 100,
    icon: '',
    backgroundUrl: '',
    status: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })
</script>
