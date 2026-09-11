# hono-agent

基于 `Hono + Cloudflare Workers + Prisma + D1 + KV` 的后端服务。

- **D1**：用户数据的唯一主库
- **KV**：按用户名缓存用户查询结果，缓存时间 5 分钟
- **Prisma**：使用 `@prisma/adapter-d1` 连接 Cloudflare D1

## 环境要求

- Bun `>= 1.3`
- Wrangler `>= 4`
- Cloudflare 账号

## 配置 Cloudflare 资源

创建 D1 和 KV namespace：

```bash
bunx wrangler d1 create hono-agent-db
bunx wrangler kv namespace create USER_CACHE
```

将命令输出的 ID 填入 [wrangler.jsonc](./wrangler.jsonc)：

```jsonc
"database_id": "你的 D1 database_id",
"id": "你的 KV namespace id"
```

`DB` 和 `USER_CACHE` 是代码中使用的 binding 名称，不要修改，除非同步修改 `src/env.ts`。

## 数据库迁移

本项目使用 Wrangler 管理 D1 migration，Prisma 只负责 schema 和 SQL 生成，不使用 `prisma db push` 或 `prisma migrate deploy`。

首次初始化（项目已包含初始 migration）：

```bash
# 本地 D1
bun run d1:migrate:local

# 远程 D1
bun run d1:migrate:remote
```

修改 [prisma/schema.prisma](./prisma/schema.prisma) 后，生成新的 SQL 并检查后再执行：

```bash
bun run db:generate
bunx prisma migrate diff \
  --from-local-d1 \
  --to-schema prisma/schema.prisma \
  --script \
  --output migrations/0002_description.sql

bunx wrangler d1 migrations apply hono-agent-db --local
bunx wrangler d1 migrations apply hono-agent-db --remote
```

如果是全新数据库，也可以重新生成初始 migration：

```bash
bun run db:migration:generate
```

> 从原 PostgreSQL 切换到 D1 时，migration 只创建表结构，不会自动搬运旧数据。旧数据需要先导出，再按 D1/SQLite 格式转换后导入。

## 本地开发

安装依赖并生成 Prisma Client：

```bash
bun install
bun run db:generate
bun run dev
```

默认地址：`http://localhost:8787`

健康检查：

```bash
curl http://localhost:8787/
```

本地 D1 和 KV 数据由 Wrangler 管理，状态目录为 `.wrangler/`，不会提交到 Git。

## 部署

确认 `wrangler.jsonc` 中已填入真实的 D1 database ID 和 KV namespace ID，然后执行：

```bash
bun run deploy
```

## 主要接口

### 注册用户

```http
POST /api/users/register
Content-Type: application/json
```

```json
{
  "username": "xiaohui",
  "password": "123456",
  "email": "xiaohui@example.com",
  "nickname": "小灰"
}
```

### 查询用户

```http
GET /api/users/:username
```

## 项目结构

```text
migrations/       D1 migration SQL
prisma/           Prisma schema
src/
  db/             Prisma D1 Client
  env.ts          Worker bindings 类型
  routes/         路由定义
  services/       业务逻辑和 KV 缓存
  worker.ts       Cloudflare Worker 入口
wrangler.jsonc    D1/KV/Worker 配置
```
