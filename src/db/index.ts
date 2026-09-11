/// <reference types="@cloudflare/workers-types" />
import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'
// Prisma Client 按 D1 binding 复用，避免每次请求重复初始化。
const clients = new WeakMap<object, PrismaClient>()

export const getDb = (database: D1Database): PrismaClient => {
  const cachedClient = clients.get(database)
  if (cachedClient) {
    return cachedClient
  }

  const client = new PrismaClient({
    adapter: new PrismaD1(database),
    log: ['error'],
  })

  clients.set(database, client)
  return client
}
