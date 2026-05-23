# 个人基金记录系统 v2.0.0

Vue3 + Vite 版本的个人基金记录工具，当前使用 localStorage mock API，后续接入真实后端时只需要替换 `src/api` 目录中的实现。

## 启动

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:5173
```

## Mock 数据说明

- 用户列表：`users`
- 登录 token：`token`
- 当前用户：`currentUser`
- 用户基金记录：`fund_records_${username}`

## 真实接口预留

`src/api/request.js` 中的 `USE_MOCK_API` 控制是否使用 mock API。

真实后端接口已在 `authApi.js` 和 `fundApi.js` 中预留：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/fund-records`
- `POST /api/fund-records`
- `PUT /api/fund-records/{id}`
- `DELETE /api/fund-records/{id}`
- `POST /api/fund-records/import`
- `POST /api/fund-records/sync`
- `GET /api/fund-records/export`
