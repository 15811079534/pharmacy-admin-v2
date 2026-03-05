# Pharmacy Admin V2 - 医疗管理系统后台

> 基于 Vue3 + Element Plus + Vite + TypeScript 的现代化医疗管理后台系统

## ✨ 特性

- 🚀 **Vue 3.5** - 使用最新的 Composition API
- 💪 **TypeScript** - 完整的类型支持
- ⚡ **Vite 7** - 极速的开发体验
- 🎨 **Element Plus** - 优秀的 UI 组件库
- 📦 **Pinia** - 新一代状态管理
- 🔐 **权限控制** - 完善的路由和按钮级权限
- 📱 **响应式** - 支持桌面和移动端

## 📦 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.29 | 渐进式 JavaScript 框架 |
| Vite | 7.3.1 | 下一代前端构建工具 |
| Element Plus | 2.13.3 | Vue 3 UI 组件库 |
| Pinia | 3.0.4 | Vue 状态管理库 |
| Vue Router | 5.0.3 | Vue 官方路由 |
| Axios | 1.13.6 | HTTP 客户端 |
| TypeScript | 5.9.3 | JavaScript 超集 |
| Sass | 1.97.3 | CSS 预处理器 |

## 📁 项目结构

```
pharmacy-admin-v2/
├── src/
│   ├── api/                    # API 接口
│   │   ├── system/            # 系统管理
│   │   ├── goods/             # 药品管理
│   │   ├── order/             # 订单管理
│   │   ├── pharmacy/          # 医疗业务
│   │   ├── member/            # 会员管理
│   │   ├── comment/           # 评价管理
│   │   ├── payment/           # 支付管理
│   │   └── marketing/         # 营销管理
│   ├── components/            # 公共组件
│   ├── composables/           # 组合式函数
│   ├── layout/                # 布局组件
│   ├── router/                # 路由配置
│   ├── stores/                # Pinia 状态
│   ├── styles/                # 全局样式
│   ├── utils/                 # 工具函数
│   ├── views/                 # 页面组件
│   └── types/                 # 类型定义
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境变量
├── vite.config.ts             # Vite 配置
└── tsconfig.json              # TypeScript 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.6.0

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 🔑 默认账号

- 用户名: admin
- 密码: admin123

## 📖 功能模块

### 1. 系统管理
- 用户管理
- 角色管理
- 菜单管理
- 部门管理
- 字典管理

### 2. 药品管理
- 药品分类
- 药品信息
- 库存管理

### 3. 订单管理
- 订单列表
- 售后管理
- 物流管理

### 4. 评价管理
- 评价列表
- 评价审核
- 评价回复

### 5. 医疗业务
- 处方管理
- 门店管理
- 药师管理
- 医保管理

### 6. 会员管理
- 会员列表
- 会员等级
- 余额管理
- 收藏管理
- 浏览记录

### 7. 支付管理
- 支付记录
- 退款管理
- 充值管理

### 8. 营销管理
- 轮播图管理
- 公告管理

### 9. 日志管理
- 登录日志
- 操作日志

## 🛠️ 开发规范

### 代码规范

- 使用 ESLint + Prettier
- 遵循 Vue 3 官方风格指南
- TypeScript 严格模式
- 组件使用 `<script setup>` 语法

### 命名规范

- 组件: PascalCase (UserList.vue)
- 工具函数: camelCase (formatDate.ts)
- 样式文件: kebab-case (user-list.scss)
- 常量: UPPER_SNAKE_CASE

### Git 提交规范

```
<type>: <subject>

<body>
```

Type 类型:
- feat: 新功能
- fix: 修复 Bug
- refactor: 重构
- docs: 文档
- style: 格式
- test: 测试
- chore: 构建/工具

## 📝 开发进度

- [x] 项目初始化
- [x] 基础框架搭建
- [x] 登录页面
- [x] 首页仪表盘
- [ ] 系统管理模块
- [ ] 药品管理模块
- [ ] 订单管理模块
- [ ] 医疗业务模块
- [ ] 会员管理模块
- [ ] 其他功能模块

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

[MIT](LICENSE)

## 📧 联系方式

- 项目地址: pharmacy-admin-v2
- 问题反馈: Issues

---

**如果这个项目对您有帮助,请给个 ⭐️ Star 支持一下!**

