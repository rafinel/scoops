import { and, eq, gt, lte, lt, sql } from 'drizzle-orm'

import { betterAuthRateLimitModel } from '@/identity/database/drizzle/models/better-auth-rate-limit-model'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

type RateLimitValue = {
  key: string
  count: number
  lastRequest: number
}

type RateLimitRule = {
  window: number
  max: number
}

export function createBetterAuthRateLimitStorage(database: Database) {
  const get = async (key: string): Promise<RateLimitValue | null> => {
    const rows = await database
      .select()
      .from(betterAuthRateLimitModel)
      .where(eq(betterAuthRateLimitModel.key, key))
      .limit(1)
    return rows[0] ?? null
  }

  const set = async (
    key: string,
    value: RateLimitValue,
    update = false,
  ): Promise<void> => {
    if (update) {
      await database
        .update(betterAuthRateLimitModel)
        .set({ count: value.count, lastRequest: value.lastRequest })
        .where(eq(betterAuthRateLimitModel.key, key))
      return
    }

    await database
      .insert(betterAuthRateLimitModel)
      .values({ key, count: value.count, lastRequest: value.lastRequest })
      .onConflictDoNothing({ target: betterAuthRateLimitModel.key })
  }

  const consume = async (
    key: string,
    rule: RateLimitRule,
  ): Promise<{ allowed: boolean; retryAfter: number | null }> => {
    const now = Date.now()
    const windowStart = now - rule.window * 1_000
    const current = await get(key)

    if (!current) {
      try {
        await database
          .insert(betterAuthRateLimitModel)
          .values({ key, count: 1, lastRequest: now })
          .onConflictDoNothing({ target: betterAuthRateLimitModel.key })
        const created = await get(key)
        if (created?.lastRequest === now && created.count === 1) {
          return { allowed: true, retryAfter: null }
        }
      } catch {
        // A concurrent creator is handled by the read/retry below.
      }
    } else if (now - current.lastRequest > rule.window * 1_000) {
      const reset = await database
        .update(betterAuthRateLimitModel)
        .set({ count: 1, lastRequest: now })
        .where(
          and(
            eq(betterAuthRateLimitModel.key, key),
            lte(betterAuthRateLimitModel.lastRequest, current.lastRequest),
          ),
        )
        .returning({ key: betterAuthRateLimitModel.key })
      if (reset.length > 0) return { allowed: true, retryAfter: null }
    } else {
      const incremented = await database
        .update(betterAuthRateLimitModel)
        .set({
          count: sql`${betterAuthRateLimitModel.count} + 1`,
          lastRequest: now,
        })
        .where(
          and(
            eq(betterAuthRateLimitModel.key, key),
            gt(betterAuthRateLimitModel.lastRequest, windowStart),
            lt(betterAuthRateLimitModel.count, rule.max),
          ),
        )
        .returning({ key: betterAuthRateLimitModel.key })
      if (incremented.length > 0) return { allowed: true, retryAfter: null }
    }

    const fresh = await get(key)
    if (!fresh) return consume(key, rule)
    if (now - fresh.lastRequest > rule.window * 1_000) return consume(key, rule)

    return {
      allowed: false,
      retryAfter: Math.ceil((fresh.lastRequest + rule.window * 1_000 - now) / 1_000),
    }
  }

  return { get, set, consume }
}
