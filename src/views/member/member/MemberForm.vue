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
        <div class="level-row">
          <el-select v-model="formData.levelId" placeholder="请选择会员等级" class="level-select">
            <el-option
              v-for="item in levelList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.disabled"
            />
          </el-select>
          <el-button link type="primary" @click="goLevelManage">去维护等级</el-button>
        </div>
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
import { useRouter } from 'vue-router'
import { useDialog } from '@/hooks/useDialog'
import * as MemberApi from '@/api/member/member'
import * as MemberLevelApi from '@/api/member/level'
import type { MemberVO } from '@/api/member/member'

const emit = defineEmits(['success'])
const router = useRouter()

const { dialogVisible, dialogTitle, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})

const formRef = ref()
const levelList = ref<Array<{ value: number; label: string; disabled?: boolean }>>([])

const formData = ref<MemberVO>({
  nickname: '',
  phone: '',
  levelId: undefined as any,
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

const ensureCurrentLevelOption = (levelId?: number) => {
  if (!levelId) return
  const existed = levelList.value.some((item) => item.value === levelId)
  if (!existed) {
    levelList.value = [
      { value: levelId, label: `当前等级#${levelId}（已禁用或已删除）` },
      ...levelList.value
    ]
  }
}

const loadLevelList = async (currentLevelId?: number) => {
  try {
    const list = await MemberLevelApi.getMemberLevelSimpleList()
    levelList.value = list.map((item) => ({
      value: item.id,
      label: item.name || `等级#${item.id}`
    }))
    ensureCurrentLevelOption(currentLevelId)

    if (!levelList.value.length) {
      ElMessage.warning('未配置会员等级，请先前往会员管理-会员等级创建')
      return
    }
    if (!currentLevelId) {
      const firstLevel = levelList.value[0]
      if (firstLevel) {
        formData.value.levelId = firstLevel.value
      }
    }
  } catch (error) {
    ElMessage.error('获取会员等级失败')
  }
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
  open(type, type === 'update' ? '编辑会员' : '新增会员')
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const data = await MemberApi.getMember(id)
      formData.value = data
      await loadLevelList(data.levelId)
    } catch (error) {
      ElMessage.error('获取会员信息失败')
    } finally {
      formLoading.value = false
    }
    return
  }
  await loadLevelList()
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
    levelId: undefined as any,
    balance: 0,
    points: 0
  }
  levelList.value = []
  formRef.value?.resetFields()
}

const goLevelManage = () => {
  dialogVisible.value = false
  router.push('/member/level')
}

defineExpose({ openDialog })
</script>

<style scoped lang="scss">
.level-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.level-select {
  flex: 1;
}
</style>
