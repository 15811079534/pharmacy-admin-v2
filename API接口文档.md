# API 接口文档

## 基础配置

### 请求封装
- 文件: `src/utils/request.ts`
- 基础 URL: `import.meta.env.VITE_APP_BASE_API`
- 超时时间: 50000ms
- 请求头: `Content-Type: application/json;charset=utf-8`
- Token: `Authorization: Bearer ${token}`

### 响应格式
```typescript
{
  code: number      // 0: 成功, 其他: 失败
  data: any        // 响应数据
  msg: string      // 响应消息
}
```

---

## 1. 认证模块 (auth)

### 登录
- **接口**: `POST /auth/login`
- **参数**:
  ```typescript
  {
    username: string
    password: string
    remember?: boolean
  }
  ```
- **响应**:
  ```typescript
  {
    token: string
    userInfo: {
      id: number
      username: string
      nickname: string
      avatar?: string
      roles: string[]
      permissions: string[]
    }
  }
  ```

### 登出
- **接口**: `POST /auth/logout`

### 获取用户信息
- **接口**: `GET /auth/user-info`

---

## 2. 系统管理模块 (system)

### 2.1 用户管理 (user)

#### 查询用户分页
- **接口**: `GET /system/user/page`
- **参数**: `username, status, pageNo, pageSize`

#### 查询用户详情
- **接口**: `GET /system/user/get`
- **参数**: `id`

#### 新增用户
- **接口**: `POST /system/user/create`

#### 修改用户
- **接口**: `PUT /system/user/update`

#### 删除用户
- **接口**: `DELETE /system/user/delete`
- **参数**: `id`

#### 导出用户
- **接口**: `GET /system/user/export`

### 2.2 角色管理 (role)

#### 查询角色分页
- **接口**: `GET /system/role/page`
- **参数**: `name, status, pageNo, pageSize`

#### 查询角色详情
- **接口**: `GET /system/role/get`

#### 新增角色
- **接口**: `POST /system/role/create`

#### 修改角色
- **接口**: `PUT /system/role/update`

#### 删除角色
- **接口**: `DELETE /system/role/delete`

#### 查询角色列表
- **接口**: `GET /system/role/list`

### 2.3 菜单管理 (menu)

#### 查询菜单列表
- **接口**: `GET /system/menu/list`
- **参数**: `name, status`

#### 查询菜单详情
- **接口**: `GET /system/menu/get`

#### 新增菜单
- **接口**: `POST /system/menu/create`

#### 修改菜单
- **接口**: `PUT /system/menu/update`

#### 删除菜单
- **接口**: `DELETE /system/menu/delete`

### 2.4 部门管理 (dept)

#### 查询部门列表
- **接口**: `GET /system/dept/list`
- **参数**: `name, status`

#### 查询部门详情
- **接口**: `GET /system/dept/get`

#### 新增部门
- **接口**: `POST /system/dept/create`

#### 修改部门
- **接口**: `PUT /system/dept/update`

#### 删除部门
- **接口**: `DELETE /system/dept/delete`

### 2.5 字典管理 (dict)

#### 查询字典分页
- **接口**: `GET /system/dict/page`
- **参数**: `name, type, pageNo, pageSize`

#### 查询字典详情
- **接口**: `GET /system/dict/get`

#### 新增字典
- **接口**: `POST /system/dict/create`

#### 修改字典
- **接口**: `PUT /system/dict/update`

#### 删除字典
- **接口**: `DELETE /system/dict/delete`

---

## 3. 药品管理模块 (goods)

### 3.1 药品信息 (goods)

#### 查询药品分页
- **接口**: `GET /goods/goods/page`
- **参数**: `name, categoryId, status, pageNo, pageSize`

#### 查询药品详情
- **接口**: `GET /goods/goods/get`

#### 新增药品
- **接口**: `POST /goods/goods/create`

#### 修改药品
- **接口**: `PUT /goods/goods/update`

#### 删除药品
- **接口**: `DELETE /goods/goods/delete`

#### 导出药品
- **接口**: `GET /goods/goods/export`

### 3.2 药品分类 (category)

#### 查询分类列表
- **接口**: `GET /goods/category/list`
- **参数**: `name, status`

#### 查询分类详情
- **接口**: `GET /goods/category/get`

#### 新增分类
- **接口**: `POST /goods/category/create`

#### 修改分类
- **接口**: `PUT /goods/category/update`

#### 删除分类
- **接口**: `DELETE /goods/category/delete`

### 3.3 库存管理 (stock)

#### 查询库存分页
- **接口**: `GET /goods/stock/page`
- **参数**: `goodsName, pageNo, pageSize`

#### 查询库存详情
- **接口**: `GET /goods/stock/get`

#### 入库
- **接口**: `POST /goods/stock/inbound`
- **参数**:
  ```typescript
  {
    goodsId: number
    quantity: number
    reason: string
  }
  ```

#### 出库
- **接口**: `POST /goods/stock/outbound`
- **参数**:
  ```typescript
  {
    goodsId: number
    quantity: number
    reason: string
  }
  ```

---

## 4. 订单管理模块 (order)

### 4.1 订单列表 (order)

#### 查询订单分页
- **接口**: `GET /order/order/page`
- **参数**: `orderNo, status, pageNo, pageSize`

#### 查询订单详情
- **接口**: `GET /order/order/get`

#### 发货
- **接口**: `POST /order/order/ship`
- **参数**:
  ```typescript
  {
    id: number
    logisticsCompany: string
    logisticsNo: string
  }
  ```

#### 取消订单
- **接口**: `POST /order/order/cancel`
- **参数**: `id, reason`

#### 导出订单
- **接口**: `GET /order/order/export`

### 4.2 售后管理 (aftersale)

#### 查询售后分页
- **接口**: `GET /order/aftersale/page`
- **参数**: `orderNo, type, status, pageNo, pageSize`

#### 查询售后详情
- **接口**: `GET /order/aftersale/get`

#### 审核通过
- **接口**: `POST /order/aftersale/approve`
- **参数**: `id`

#### 审核拒绝
- **接口**: `POST /order/aftersale/reject`
- **参数**: `id, reason`

### 4.3 物流管理 (logistics)

#### 查询物流分页
- **接口**: `GET /order/logistics/page`
- **参数**: `orderNo, logisticsNo, pageNo, pageSize`

#### 查询物流详情
- **接口**: `GET /order/logistics/get`

#### 查询物流轨迹
- **接口**: `GET /order/logistics/track`
- **参数**: `id`

---

## 5. 医疗业务模块 (pharmacy)

### 5.1 门店管理 (store)

#### 查询门店分页
- **接口**: `GET /pharmacy/store/page`
- **参数**: `name, status, pageNo, pageSize`

#### 查询门店详情
- **接口**: `GET /pharmacy/store/get`

#### 新增门店
- **接口**: `POST /pharmacy/store/create`

#### 修改门店
- **接口**: `PUT /pharmacy/store/update`

#### 删除门店
- **接口**: `DELETE /pharmacy/store/delete`

### 5.2 处方管理 (prescription)

#### 查询处方分页
- **接口**: `GET /pharmacy/prescription/page`
- **参数**: `prescriptionNo, status, pageNo, pageSize`

#### 查询处方详情
- **接口**: `GET /pharmacy/prescription/get`

#### 审核通过
- **接口**: `POST /pharmacy/prescription/approve`
- **参数**: `id`

#### 审核拒绝
- **接口**: `POST /pharmacy/prescription/reject`
- **参数**: `id, reason`

### 5.3 药师管理 (pharmacist)

#### 查询药师分页
- **接口**: `GET /pharmacy/pharmacist/page`
- **参数**: `name, status, pageNo, pageSize`

#### 查询药师详情
- **接口**: `GET /pharmacy/pharmacist/get`

#### 新增药师
- **接口**: `POST /pharmacy/pharmacist/create`

#### 修改药师
- **接口**: `PUT /pharmacy/pharmacist/update`

#### 删除药师
- **接口**: `DELETE /pharmacy/pharmacist/delete`

### 5.4 医保管理 (insurance)

#### 查询医保分页
- **接口**: `GET /pharmacy/insurance/page`
- **参数**: `userName, status, pageNo, pageSize`

#### 查询医保详情
- **接口**: `GET /pharmacy/insurance/get`

#### 审核通过
- **接口**: `POST /pharmacy/insurance/approve`
- **参数**: `id`

#### 审核拒绝
- **接口**: `POST /pharmacy/insurance/reject`
- **参数**: `id, reason`

---

## 6. 会员管理模块 (member)

### 6.1 会员列表 (member)

#### 查询会员分页
- **接口**: `GET /member/member/page`
- **参数**: `nickname, phone, status, pageNo, pageSize`

#### 查询会员详情
- **接口**: `GET /member/member/get`

#### 修改会员
- **接口**: `PUT /member/member/update`

### 6.2 会员等级 (level)

#### 查询等级分页
- **接口**: `GET /member/level/page`
- **参数**: `name, pageNo, pageSize`

#### 查询等级详情
- **接口**: `GET /member/level/get`

#### 新增等级
- **接口**: `POST /member/level/create`

#### 修改等级
- **接口**: `PUT /member/level/update`

#### 删除等级
- **接口**: `DELETE /member/level/delete`

### 6.3 余额管理 (balance)

#### 查询余额记录分页
- **接口**: `GET /member/balance/page`
- **参数**: `userName, type, pageNo, pageSize`

---

## 7. 评价管理模块 (comment)

#### 查询评价分页
- **接口**: `GET /comment/page`
- **参数**: `goodsName, status, pageNo, pageSize`

#### 查询评价详情
- **接口**: `GET /comment/get`

#### 审核通过
- **接口**: `POST /comment/approve`
- **参数**: `id`

#### 审核拒绝
- **接口**: `POST /comment/reject`
- **参数**: `id, reason`

#### 回复评价
- **接口**: `POST /comment/reply`
- **参数**: `id, reply`

---

## 8. 支付管理模块 (payment)

### 8.1 支付记录 (payment)

#### 查询支付分页
- **接口**: `GET /payment/payment/page`
- **参数**: `paymentNo, payType, status, pageNo, pageSize`

#### 查询支付详情
- **接口**: `GET /payment/payment/get`

#### 导出支付记录
- **接口**: `GET /payment/payment/export`

### 8.2 退款管理 (refund)

#### 查询退款分页
- **接口**: `GET /payment/refund/page`
- **参数**: `refundNo, status, pageNo, pageSize`

#### 查询退款详情
- **接口**: `GET /payment/refund/get`

#### 处理退款
- **接口**: `POST /payment/refund/process`
- **参数**: `id, status, reason`

---

## 9. 营销管理模块 (marketing)

### 9.1 轮播图管理 (banner)

#### 查询轮播图分页
- **接口**: `GET /marketing/banner/page`
- **参数**: `title, status, pageNo, pageSize`

#### 查询轮播图详情
- **接口**: `GET /marketing/banner/get`

#### 新增轮播图
- **接口**: `POST /marketing/banner/create`

#### 修改轮播图
- **接口**: `PUT /marketing/banner/update`

#### 删除轮播图
- **接口**: `DELETE /marketing/banner/delete`

### 9.2 公告管理 (notice)

#### 查询公告分页
- **接口**: `GET /marketing/notice/page`
- **参数**: `title, status, pageNo, pageSize`

#### 查询公告详情
- **接口**: `GET /marketing/notice/get`

#### 新增公告
- **接口**: `POST /marketing/notice/create`

#### 修改公告
- **接口**: `PUT /marketing/notice/update`

#### 删除公告
- **接口**: `DELETE /marketing/notice/delete`

---

## 10. 日志管理模块 (log)

### 10.1 登录日志 (login)

#### 查询登录日志分页
- **接口**: `GET /log/login/page`
- **参数**: `username, ip, status, loginTime, pageNo, pageSize`

#### 导出登录日志
- **接口**: `GET /log/login/export`

### 10.2 操作日志 (operate)

#### 查询操作日志分页
- **接口**: `GET /log/operate/page`
- **参数**: `username, module, type, createTime, pageNo, pageSize`

#### 查询操作日志详情
- **接口**: `GET /log/operate/get`

#### 导出操作日志
- **接口**: `GET /log/operate/export`

---

## 通用说明

### 分页参数
```typescript
{
  pageNo: number    // 页码，从 1 开始
  pageSize: number  // 每页条数
}
```

### 分页响应
```typescript
{
  list: T[]        // 数据列表
  total: number    // 总条数
}
```

### 状态码
- `0`: 成功
- `401`: 未授权
- `403`: 无权限
- `500`: 服务器错误

### 文件上传
- **接口**: `POST /upload`
- **参数**: `FormData`
- **响应**: `{ url: string }`
