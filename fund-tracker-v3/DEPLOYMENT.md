# 个人基金记录系统 v3.1.0 公网部署说明

本项目 v3.1.0 增加公网部署配置，目标是把 Vue3 前端、Spring Boot 后端和 MySQL 数据库部署到一台云服务器上，对外生成可访问的网站。

## 你需要准备什么

1. 一台云服务器，建议 2 核 2G 起步。
2. 一个域名，可选但强烈建议使用。
3. Docker 和 Docker Compose。
4. 开放服务器安全组端口：80、443；如需调试再临时开放 8080。
5. HTTPS 证书，推荐用 Nginx Proxy Manager、Caddy、Certbot 或云厂商证书服务。

## 本次新增文件

- `frontend/Dockerfile`：构建前端静态文件并用 Nginx 托管。
- `frontend/nginx.conf`：前端路由回退到 `index.html`，并把 `/api` 代理到后端容器。
- `frontend/.env.production`：生产前端使用相对路径 `/api` 请求后端。
- `docker-compose.prod.yml`：生产环境编排 MySQL、后端、前端三个容器。
- `.env.production.example`：生产环境变量模板。
- `DEPLOYMENT.md`：公网部署和知识点说明。

## 推荐部署架构

```text
用户浏览器
  |
  | HTTPS 443
  v
域名 / 服务器公网 IP
  |
  v
frontend Nginx 容器 80
  |-- Vue 静态页面
  |-- /api/* 反向代理到 backend:8080
  v
Spring Boot 后端容器
  |
  v
MySQL 8 容器 + Docker volume 持久化数据
```

这样前端和后端对浏览器表现为同一个站点，正式环境不会再遇到本地开发常见的 CORS 问题。

## 服务器部署步骤

### 1. 上传代码

把 `fund-tracker-v3` 上传到服务器，例如：

```bash
scp -r fund-tracker-v3 root@your-server-ip:/opt/fund-tracker-v3
```

也可以用 Git 仓库拉取：

```bash
git clone <your-repo-url> /opt/fund-tracker-v3
cd /opt/fund-tracker-v3
```

### 2. 创建生产环境变量

```bash
cd /opt/fund-tracker-v3
cp .env.production.example .env.production
```

编辑 `.env.production`，至少修改：

```text
MYSQL_ROOT_PASSWORD
MYSQL_PASSWORD
JWT_SECRET
APP_CORS_ALLOWED_ORIGINS
```

如果你有域名，示例：

```text
APP_CORS_ALLOWED_ORIGINS=https://fund.example.com
```

如果暂时只用服务器 IP：

```text
APP_CORS_ALLOWED_ORIGINS=http://your-server-ip
```

### 3. 启动生产服务

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

查看容器：

```bash
docker ps
```

查看后端日志：

```bash
docker logs -f fund-tracker-backend
```

### 4. 访问网站

如果只用 IP：

```text
http://your-server-ip
```

如果绑定了域名：

```text
http://your-domain.com
```

生产环境建议继续配置 HTTPS，最终访问：

```text
https://your-domain.com
```

## HTTPS 怎么做

最简单的方式是在服务器上增加一个外层反向代理：

```text
浏览器 HTTPS
  -> Caddy / Nginx / Nginx Proxy Manager
  -> http://127.0.0.1:80
  -> frontend 容器
```

推荐新手使用 Caddy，因为它可以自动申请和续期 Let's Encrypt 证书。你也可以使用宝塔面板或云服务器控制台配置 HTTPS。

## 域名解析

在域名服务商后台添加 DNS 解析：

```text
类型：A
主机记录：fund 或 @
记录值：你的服务器公网 IP
```

解析生效后，访问：

```text
https://fund.example.com
```

## 数据库在哪里

生产环境 MySQL 数据保存在 Docker volume：

```bash
docker volume ls
docker volume inspect fund-tracker-v3_mysql_data
```

进入数据库：

```bash
docker exec -it fund-tracker-mysql mysql -u fund_user -p fund_tracker
```

常用 SQL：

```sql
show tables;
select id, username, nickname, email, created_at from users;
select id, name, owner_id, created_at from portfolios;
select id, portfolio_id, user_id, role from portfolio_members;
select id, portfolio_id, date, daily_rate, deposit, withdraw_amount from fund_records;
```

## 必须掌握的知识点

### 1. 前后端分离

前端负责页面、表单、图表和用户交互；后端负责登录认证、权限校验、数据库读写和 API。

你需要理解：

- 浏览器如何访问前端页面。
- 前端如何通过 Axios 调用 `/api`。
- 后端如何返回 JSON。
- 生产环境为什么通常用 Nginx 代理前后端。

### 2. HTTP、HTTPS 和域名

本地开发可以使用 HTTP，但公网部署登录系统时必须使用 HTTPS。

你需要理解：

- HTTP 明文传输，不适合公网登录。
- HTTPS 会加密用户名、密码和 JWT。
- 域名通过 DNS 指向服务器公网 IP。
- 证书用于证明网站身份并启用加密。

### 3. Docker 和 Docker Compose

Docker 把前端、后端、数据库分别打包成容器；Docker Compose 负责一起启动它们。

你需要理解：

- image 是镜像，container 是运行中的容器。
- volume 用于保存 MySQL 数据。
- network 让容器之间通过服务名互相访问。
- `docker compose up -d --build` 会构建并后台启动服务。

### 4. MySQL 持久化

数据库不能只存在容器里，必须挂载 volume。

你需要理解：

- 删除容器不等于删除 volume。
- 删除 volume 会删除数据库数据。
- 备份数据库要用 `mysqldump` 或云厂商备份。

### 5. Spring Boot 生产配置

生产环境不应该把密码和密钥写死在代码里，应该放到环境变量。

你需要理解：

- `application.yml` 可以读取 `${ENV_NAME:default}`。
- JWT_SECRET 必须足够长且不能泄露。
- MySQL 密码、root 密码要单独保存。

### 6. JWT 登录认证

用户登录后获得 token，前端后续请求携带：

```text
Authorization: Bearer <token>
```

你需要理解：

- token 代表登录状态。
- token 过期后需要重新登录。
- HTTPS 可以保护 token 不被明文窃听。

### 7. 反向代理

生产环境建议让所有浏览器请求先到 Nginx 或 Caddy。

你需要理解：

- `/` 返回 Vue 页面。
- `/api` 转发到 Spring Boot。
- 前后端同源后，CORS 问题会明显减少。

### 8. 服务器安全

最少需要做到：

- 不开放 MySQL 3306 到公网。
- 不把弱密码用于数据库和 JWT。
- 使用 HTTPS。
- 定期备份 MySQL。
- 只开放 80、443，必要时开放 SSH 22。

## 新手学习路线图

1. 先会本地启动：`docker compose up -d --build`、`npm run dev`。
2. 学会看日志：`docker logs -f fund-tracker-backend`。
3. 学会进数据库：`docker exec -it fund-tracker-mysql mysql -u fund_user -p fund_tracker`。
4. 学会打包前端：`npm run build`。
5. 学会 Docker Compose 三件套：frontend、backend、mysql。
6. 学会域名解析：A 记录指向服务器 IP。
7. 学会 HTTPS：用 Caddy 或 Nginx Proxy Manager 配证书。
8. 学会备份：定期导出 MySQL 数据。
9. 学会排错：浏览器 Network、后端日志、数据库连接、端口占用。

## 常见问题

### 登录显示 Network Error

通常是：

- 后端没启动。
- 前端 API 地址写错。
- CORS 未允许当前域名。
- HTTPS 页面请求了 HTTP API，被浏览器拦截。

生产推荐使用 `/api` 相对路径并通过前端 Nginx 代理后端。

### 网站能打开但刷新 404

Vue Router 需要 Nginx 配置：

```nginx
try_files $uri $uri/ /index.html;
```

本项目 `frontend/nginx.conf` 已经配置。

### 数据库数据不见了

检查是否删除了 Docker volume：

```bash
docker volume ls
```

MySQL 数据保存在 `mysql_data` volume 中。

### 后端连不上数据库

查看 MySQL 是否启动完成：

```bash
docker logs -f fund-tracker-mysql
```

再查看后端日志：

```bash
docker logs -f fund-tracker-backend
```

## 上线前检查清单

- 已修改 `.env.production` 中的所有默认密码。
- `JWT_SECRET` 足够长且未公开。
- MySQL 3306 没有暴露到公网。
- 网站可以通过域名访问。
- HTTPS 已启用。
- 注册、登录、创建组合、新增记录、CSV 导入导出都测试通过。
- 已规划数据库备份方案。
