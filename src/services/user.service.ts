/// <reference types="@cloudflare/workers-types" />
import type { z } from 'zod'
import { BusinessException, NotFoundException } from '../core/exceptions'
import { getDb } from '../db'
import type { registerUserSchema } from '../routes/user.route'
import { hashPassword } from '../utils/password'

// 推导出注册的数据类型
type RegisterDTO = z.infer<typeof registerUserSchema>

const USER_CACHE_TTL = 300
const userCacheKey = (username: string) => `user:username:${username}`

export const UserService = {
  async register(
    database: D1Database,
    cache: KVNamespace,
    data: RegisterDTO,
  ) {
    const db = getDb(database)

    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    })

    if (existingUser) {
      throw new BusinessException(
        '用户名或邮箱已被注册',
        409,
        'USER_EXISTS',
      )
    }

    const hashedPassword = await hashPassword(data.password)
    const result = await db.user.create({
      data: {
        username: data.username,
        nickname: data.nickname,
        password: hashedPassword,
        email: data.email,
        phone: data.phone,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        plan: true,
        createdAt: true,
      },
    })

    // 防止注册同名用户后命中旧缓存；KV 故障不影响 D1 主流程。
    try {
      await cache.delete(userCacheKey(data.username))
    } catch (error) {
      console.warn('清理用户 KV 缓存失败', error)
    }

    return result
  },

  async getUserByusername(
    database: D1Database,
    cache: KVNamespace,
    username: string,
  ) {
    const key = userCacheKey(username)

    try {
      const cachedUser = await cache.get(key, 'json')
      if (cachedUser) {
        return cachedUser
      }
    } catch (error) {
      console.warn('读取用户 KV 缓存失败', error)
    }

    const db = getDb(database)
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        avatar: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        status: true,
        plan: true,
        balance: true,
        planEndTime: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    })

    if (!user) {
      throw new NotFoundException(`找不到用户名为 ${username} 的用户`)
    }

    try {
      await cache.put(key, JSON.stringify(user), {
        expirationTtl: USER_CACHE_TTL,
      })
    } catch (error) {
      console.warn('写入用户 KV 缓存失败', error)
    }

    return user
  },
}
