<template>
  <el-dialog
    v-model="dialogVisible"
    title="会员详情"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-descriptions :column="2" border v-loading="loading">
      <el-descriptions-item label="会员ID">{{ memberData.id }}</el-descriptions-item>
      <el-descriptions-item label="会员昵称">{{ memberData.nickname }}</el-descriptions-item>
      <el-descriptions-item label="头像" :span="2">
        <el-avatar :src="memberData.avatar" :size="80" />
      </el-descriptions-item>
      <el-descriptions-item label="手机号">{{ memberData.phone }}</el-descriptions-item>
      <el-descriptions-item label="会员等级">
        <el-tag type="success">{{ memberData.levelName }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="账户余额">
        <span class="text-price">¥{{ memberData.balance }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="积分">
        <span class="text-points">{{ memberData.points }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="注册时间" :span="2">{{ memberData.createTime }}</el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as MemberApi from '@/api/member/member'
import type { MemberVO } from '@/api/member/member'

const dialogVisible = ref(false)
const loading = ref(false)
const memberData = ref<MemberVO>({
  id: 0,
  nickname: '',
  avatar: '',
  phone: '',
  levelId: 1,
  levelName: '',
  balance: 0,
  points: 0,
  createTime: ''
})

const open = async (id: number) => {
  dialogVisible.value = true
  loading.value = true

  try {
    const data = await MemberApi.getMember(id)
    memberData.value = data
  } catch (error) {
    ElMessage.error('获取会员详情失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.text-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.text-points {
  color: #e6a23c;
  font-weight: bold;
  font-size: 16px;
}

.el-divider {
  margin: 20px 0;
}
</style>
