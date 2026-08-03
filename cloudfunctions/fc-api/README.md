# fc-api

FC 静态站点的最小同源 BFF。它验证云乐坊 SSO 双证明、签发可撤销的 opaque session，并在服务端执行会员和云存档策略。

## Runtime

- CloudBase HTTP Function
- Runtime: `Nodejs20.19`
- Bootstrap: `/var/lang/node20/bin/node index.cjs`
- Port: `9000`
- Gateway path: `/fc-api`
- Public function rule: 允许网关调用；业务层仍强制 exact Origin、HttpOnly session 与 session-bound CSRF

## Environment

- `CLOUDBASE_ENV_ID=yunlefun-8g7ybcxc7345c490`
- `FC_ALLOWED_ORIGINS=https://fc.yunle.fun,https://fc.elpsy.cn`
- `FC_MAX_CLOUD_SAVES=20`
- `FC_SESSION_CSRF_SECRET`：至少 32 字符，只能通过函数环境 Secret 注入

## Database resources

- `ylf_app_sessions`: `ADMINONLY`，复用 `@yunlefun/server-session-cloudbase` v2 既有索引。
- `fc_saves`: `ADMINONLY`，复合索引 `userId ASC, updatedAt DESC`。
- `fc_save_quotas`: `ADMINONLY`，以用户 ID 为文档 ID；与存档写入/删除在同一事务更新。
- `user_memberships`、`user_profiles`: `ADMINONLY`，只读复用。

`fc_saves` 当前为空，因此从浏览器 `_openid` 所有权模型迁移为服务端 `userId` 所有权模型不需要数据回填。

## Deployment order

1. 发布包含 `fc-web` 的 SSO Client Registry 和 `sso-ticket`。
2. 创建/收紧数据库集合与索引。
3. 执行 `pnpm build:function`，生成约 1 MiB 的单文件依赖包并部署 `.cloudbase/functions/fc-api`；产物不依赖云端安装 npm 包。
4. 注入环境变量和 CSRF Secret，开放函数网关权限并绑定 `/fc-api`。
5. 在 EdgeOne Makers 连接 Git 仓库并部署预览环境；仓库内 `cloud-functions/api/[[default]].js` 接管 `/api/*`。预览环境只验证静态资源、Functions 构建和 `/api/health`，因为 SSO/unsafe API 必须匹配精确生产 Origin。
6. 确认上游 Registry、数据库、Function 与网关均已就绪后，将 `fc.yunle.fun` 与兼容域名 `fc.elpsy.cn` 切换到 EdgeOne，再验证生产域名的登录、Cookie 和云存档；保留 DNS 回滚方案。
