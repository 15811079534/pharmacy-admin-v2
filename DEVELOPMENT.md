# Pharmacy Admin V2 - 功能实现指南

## 已完成的核心功能

### 1. 通用 Hooks（可复用）

#### `useTable` - 表格数据管理
位置：`src/hooks/useTable.ts`

功能：
- 自动管理 loading 状态
- 分页参数管理
- 数据获取和错误处理
- 查询和重置功能

使用示例：
```typescript
const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: UserApi.getUserPage
})
```

#### `useDialog` - 弹窗管理
位置：`src/hooks/useDialog.ts`

功能：
- 弹窗显示/隐藏控制
- 表单类型管理（新增/编辑）
- 提交状态管理
- 成功/失败回调

使用示例：
```typescript
const { dialogVisible, dialogTitle, formType, formLoading, open, submit } = useDialog({
  onSuccess: () => emit('success')
})
```

#### `useFormGenerator` - 表单生成器
位置：`src/hooks/useFormGenerator.ts`

功能：
- 根据配置自动生成表单数据
- 自动生成验证规则
- 表单重置功能

### 2. API 服务层

已创建的 API 模块：
- ✅ `src/api/system/user.ts` - 用户管理 API
- ✅ `src/api/goods/goods.ts` - 药品管理 API
- ✅ `src/api/order/order.ts` - 订单管理 API

API 标准结构：
```typescript
export interface EntityVO {
  id?: number
  // 其他字段
}

export interface EntityPageReqVO {
  // 查询条件
  pageNo: number
  pageSize: number
}

// 标准 CRUD 方法
export const getEntityPage = (params: EntityPageReqVO) => { }
export const getEntity = (id: number) => { }
export const createEntity = (data: EntityVO) => { }
export const updateEntity = (data: EntityVO) => { }
export const deleteEntity = (id: number) => { }
export const exportEntity = (params: EntityPageReqVO) => { }
```

### 3. 完整实现的模块

#### ✅ 用户管理（System/User）
- 列表页面：`src/views/system/user/index.vue`
- 表单组件：`src/views/system/user/UserForm.vue`
- API 服务：`src/api/system/user.ts`

功能：
- 分页查询（用户名、状态筛选）
- 新增用户（表单验证）
- 编辑用户
- 删除用户（二次确认）
- 状态管理

#### ✅ 药品管理（Goods/Goods）
- 列表页面：`src/views/goods/goods/index.vue`
- 表单组件：`src/views/goods/goods/GoodsForm.vue`
- API 服务：`src/api/goods/goods.ts`

功能：
- 分页查询（药品名称、分类、状态筛选）
- 新增药品（包含图片上传）
- 编辑药品
- 删除药品
- 导出数据

特色功能：
- 图片上传预览
- 价格和库存数字输入
- 富文本描述

#### ✅ 订单管理（Order/Order）
- 列表页面：`src/views/order/order/index.vue`
- 详情组件：`src/views/order/order/OrderDetail.vue`
- 发货组件：`src/views/order/order/DeliverForm.vue`
- API 服务：`src/api/order/order.ts`

功能：
- 分页查询（订单号、状态、时间范围筛选）
- 订单详情查看（商品明细）
- 订单发货（物流信息）
- 取消订单（输入原因）
- 导出数据

特色功能：
- 订单状态流转
- 商品明细展示
- 物流信息录入

## 如何快速开发其他模块

### 步骤 1：创建 API 服务

复制 `src/api/system/user.ts` 作为模板，修改：
1. 接口路径（如 `/pharmacy/store`）
2. VO 接口定义
3. 查询参数接口

### 步骤 2：创建表单组件

复制 `src/views/system/user/UserForm.vue` 作为模板，修改：
1. 导入对应的 API
2. 修改 formData 结构
3. 修改 formRules 验证规则
4. 调整表单字段

### 步骤 3：更新列表页面

在现有的列表页面中：
1. 导入 `useTable` hook
2. 导入对应的 API 和表单组件
3. 替换 script 部分的逻辑
4. 添加表单组件引用

示例代码：
```vue
<script setup lang="ts">
import { useTable } from '@/hooks/useTable'
import * as YourApi from '@/api/your/module'
import YourForm from './YourForm.vue'

const formRef = ref()
const queryParams = reactive({
  // 查询参数
  pageNo: 1,
  pageSize: 10
})

const { loading, tableData, total, getList, handleQuery, handleReset } = useTable({
  fetchData: YourApi.getYourPage
})

const handleAdd = () => {
  formRef.value?.openDialog('create')
}

const handleEdit = (row: any) => {
  formRef.value?.openDialog('update', row.id)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await YourApi.deleteYour(row.id)
    ElMessage.success('删除成功')
    await getList()
  } catch (error) {}
}

onMounted(() => {
  getList()
})
</script>

<template>
  <!-- 在搜索表单后添加 -->
  <YourForm ref="formRef" @success="getList" />
</template>
```

## 待实现的模块清单

### 系统管理
- ⏳ 角色管理 - `/system/role`
- ⏳ 菜单管理 - `/system/menu`
- ⏳ 部门管理 - `/system/dept`
- ⏳ 字典管理 - `/system/dict`

### 药品管理
- ⏳ 药品分类 - `/goods/category`
- ⏳ 库存管理 - `/goods/stock`

### 订单管理
- ⏳ 售后管理 - `/order/aftersale`
- ⏳ 物流管理 - `/order/logistics`

### 医疗业务
- ⏳ 处方管理 - `/pharmacy/prescription`
- ⏳ 门店管理 - `/pharmacy/store`
- ⏳ 药师管理 - `/pharmacy/pharmacist`
- ⏳ 医保管理 - `/pharmacy/insurance`

### 会员管理
- ⏳ 会员列表 - `/member/member`
- ⏳ 会员等级 - `/member/level`
- ⏳ 余额管理 - `/member/balance`

### 其他模块
- ⏳ 评价管理 - `/comment`
- ⏳ 支付记录 - `/payment/payment`
- ⏳ 退款管理 - `/payment/refund`
- ⏳ 轮播图管理 - `/marketing/banner`
- ⏳ 公告管理 - `/marketing/notice`
- ⏳ 登录日志 - `/log/login`
- ⏳ 操作日志 - `/log/operate`

## 开发建议

### 1. 优先级排序
建议按以下顺序开发：
1. 医疗业务模块（核心功能）
2. 会员管理模块
3. 营销管理模块
4. 日志管理模块

### 2. 代码复用
- 相似的模块可以共享表单组件
- 使用 `useTable` 和 `useDialog` 减少重复代码
- 统一的 API 调用方式

### 3. 表单验证规则
常用验证规则：
```typescript
// 必填
{ required: true, message: '不能为空', trigger: 'blur' }

// 长度限制
{ min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }

// 手机号
{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }

// 邮箱
{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }

// 数字范围
{ type: 'number', min: 0, message: '必须大于0', trigger: 'blur' }
```

### 4. 状态管理
使用统一的状态码：
- 0: 启用/正常/成功
- 1: 禁用/异常/失败
- 2+: 其他业务状态

### 5. 错误处理
所有 API 调用都应该：
- 使用 try-catch 捕获错误
- 显示友好的错误提示
- 在 finally 中重置 loading 状态

## 性能优化建议

1. **图片懒加载**：大量图片时使用 `v-lazy`
2. **虚拟滚动**：长列表使用 `el-virtual-list`
3. **防抖搜索**：搜索输入使用 `debounce`
4. **分页加载**：避免一次加载过多数据

## 下一步工作

1. 完成剩余模块的 API 服务层
2. 为每个模块创建表单组件
3. 更新列表页面集成 API
4. 添加权限控制
5. 编写单元测试
6. 性能优化

---

**开发服务器**: http://localhost:5173
**登录账号**: admin / admin123
