/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database
  USER_CACHE: KVNamespace
}
