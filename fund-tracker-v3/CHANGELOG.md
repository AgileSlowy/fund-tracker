# 更新日志

## v3.1.0 - 公网部署准备

- 新增 `frontend/Dockerfile`，支持把 Vue3 前端构建为生产静态资源并由 Nginx 托管。
- 新增 `frontend/nginx.conf`，支持 Vue Router 刷新回退，并将 `/api` 反向代理到后端容器。
- 新增 `frontend/.env.production`，生产环境前端统一使用 `/api` 相对路径访问后端。
- 新增 `docker-compose.prod.yml`，用于生产环境一键编排 MySQL、Spring Boot 后端和前端 Nginx。
- 新增 `.env.production.example`，集中配置数据库密码、JWT 密钥和生产允许访问的域名。
- 后端 CORS 改为读取 `APP_CORS_ALLOWED_ORIGINS` 环境变量，便于公网域名部署。
- 新增 `DEPLOYMENT.md`，整理公网部署步骤、HTTPS、域名解析、数据库查看、Docker 和服务器安全等必备知识点。
- 更新前端和后端版本号为 `3.1.0`。
