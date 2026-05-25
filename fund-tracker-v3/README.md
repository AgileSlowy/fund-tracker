# 个人基金记录系统 v3.1.0

第三版是完整的前后端分离基金记录系统，包含 Vue3 前端、Spring Boot 后端、MySQL 数据库、JWT 登录认证、基金组合共享、成员权限、CSV 导入导出和 Docker 部署配置。

v3.1.0 在 v3.0.0 基础上新增公网部署配置和部署知识说明，详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 技术栈

- 前端：Vue3、Vite、Pinia、Vue Router、Axios、ECharts
- 后端：Spring Boot 3.x、Java 17、Spring Security 6.x、JWT、Spring Data JPA
- 数据库：MySQL 8
- 部署：Docker、Docker Compose、Nginx

## 目录结构

```text
fund-tracker-v3/
├── frontend/                 # Vue3 前端
├── backend/                  # Spring Boot 后端
├── docker-compose.yml        # 本地开发：MySQL + 后端
├── docker-compose.prod.yml   # 生产部署：MySQL + 后端 + 前端
├── .env.production.example   # 生产环境变量模板
├── DEPLOYMENT.md             # 公网部署说明
└── README.md
```

## 本地启动

### 1. 启动 MySQL 和后端

```bash
docker compose up -d --build
```

### 2. 查看容器

```bash
docker ps
```

### 3. 查看后端日志

```bash
docker logs -f fund-tracker-backend
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 5. 访问

```text
http://localhost:5173
```

如果 5173 被占用，Vite 可能自动切到 5174，以终端输出为准。

## 生产部署

生产部署使用：

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

部署后可通过服务器公网 IP 或域名访问：

```text
http://your-server-ip
https://your-domain.com
```

生产环境必须修改 `.env.production` 中的密码和密钥，并建议配置 HTTPS。

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 数据库连接信息

本地默认配置：

- Host：`localhost`
- Port：`3306`
- Database：`fund_tracker`
- Username：`fund_user`
- Password：`fund_pass`
- Root Password：`123456`

进入数据库：

```bash
docker exec -it fund-tracker-mysql mysql -u fund_user -p fund_tracker
```

## API 地址

本地后端：

```text
http://localhost:8080/api
```

生产前端默认通过相对路径访问：

```text
/api
```

前端 Nginx 会把 `/api` 代理到后端容器。

## 默认使用流程

1. 注册账号并登录。
2. 创建基金组合，创建者自动成为 `OWNER`。
3. 在组合详情页新增基金记录或导入 CSV。
4. 注册第二个账号。
5. 使用 `OWNER` 账号在成员管理中邀请第二个账号为 `EDITOR` 或 `VIEWER`。
6. 第二个账号登录后，可以在组合列表看到共享组合。

## 权限说明

- `OWNER`：管理组合、管理成员、新增/编辑/删除记录、CSV 导入导出。
- `EDITOR`：新增/编辑/删除记录、CSV 导入导出，不能管理成员和删除组合。
- `VIEWER`：查看组合、成员、记录、图表和 CSV 导出，不能修改数据。

权限由后端 Service 层校验，前端只负责展示控制。

## 常见问题

### 登录显示 Network Error

通常是后端没启动、API 地址错误、CORS 未允许当前域名，或 HTTPS 页面请求了 HTTP API。

生产环境推荐使用 `/api` 相对路径，由 Nginx 代理到后端。

### 浏览器访问 `/api` 返回 401

这是正常的，说明后端需要登录认证。未携带 token 访问受保护接口会返回 401。

### 数据库数据在哪里

MySQL 数据保存在 Docker volume 中：

```bash
docker volume ls
docker volume inspect fund-tracker-v3_mysql_data
```

### 公网部署需要学什么

从这几部分入手：

- 域名和 DNS 解析
- HTTP、HTTPS 和证书
- Nginx 或 Caddy 反向代理
- Docker 镜像、容器、网络、volume
- Spring Boot 环境变量配置
- MySQL 数据备份
- Linux 服务器基础命令
