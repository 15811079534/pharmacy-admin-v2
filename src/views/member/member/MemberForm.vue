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
      <el-form-item label="会员昵称" prop="nickname">
        <el-input v-model="formData.nickname" placeholder="请输入会员昵称" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="会员等级" prop="levelId">
        <el-select v-model="formData.levelId" placeholder="请选择会员等级" style="width: 100%">
          <el-option
            v-for="item in levelList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
import * as MemberApi from '@/api/member/member'
import type { MemberVO } from '@/api/member/member'

const emit = defineEmits(['success'])

const { dialogVisible, dialogTitle, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const levelList = ref([
  { value: 1, label: '普通会员' },
  { value: 2, label: '银卡会员' },
  { value: 3, label: '金卡会员' }
])

const formData = ref<MemberVO>({
  nickname: '',
  phone: '',
  levelId: 1,
  balance: 0,
  points: 0
})

const formRules = {
  nickname: [
    { required: true, message: '请输入会员昵称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  levelId: [
    { required: true, message: '请选择会员等级', trigger: 'change' }
  ]
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type, type === 'update' ? '编辑会员' : '新增会员')
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const data = await MemberApi.getMember(id)
      formData.value = data
    } catch (error) {
      ElMessage.error('获取会员信息失败')
    } finally {
      formLoading.value = false
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  await submit(async () => {
    return await MemberApi.updateMember(formData.value)
  })
}

const resetForm = () => {
  formData.value = {
    nickname: '',
    phone: '',
    levelId: 1,
    balance: 0,
    points: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ openDialog })
</script>
