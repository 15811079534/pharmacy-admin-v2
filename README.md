# 后台管理端说明

本目录是医疗小程序后台管理前端。客户启动项目时，请优先阅读根目录的 `启动指南.md`，不要按旧模板文档操作。

## 真实运行配置

| 项目 | 当前值 |
| --- | --- |
| 技术栈 | Vue 3、Vite 7、Element Plus、Pinia、TypeScript |
| 开发端口 | `5173` |
| 默认接口 | `https://azhe.tech/admin-api` |
| 环境文件 | `.env.development`、`.env.production` |

默认交付配置连接线上服务 `https://azhe.tech/admin-api`。如果客户要联调本地后端，再把 `.env.development` 中的接口改为：

```properties
VITE_APP_BASE_API=http://127.0.0.1:48080/admin-api
```

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
```

构建产物目录：

```text
dist/
```

## 当前后台页面

- 首页仪表盘
- 个人中心
- 修改密码
- 药品分类
- 商品品牌
- 药品信息
- 库存管理
- 订单列表
- 售后管理
- 物流管理
- 物流公司
- 处方管理
- 门店管理
- 医保管理
- 会员列表
- 会员等级
- 轮播图管理
- 公告管理

## 默认账号

```text
用户名：admin
密码：admin123
```

客户第一次登录后应立即修改默认密码。

## 交付提醒

压缩源码给客户时不要包含：

```text
node_modules/
dist/
.git/
```
