import { Inject, Injectable } from "@nestjs/common";
import type { RedisClientType } from "redis";
import { SessionManager } from "@application/interfaces/session-manager.interface";

/**
 * Redis-backed authenticated-session index.
 *
 * connect-redis stores each Express session under `session:<sessionId>`.
 * We maintain a separate per-user Redis set so we can invalidate a user's
 * other sessions without scanning the entire session store.
 *
 * Stale session IDs are expected because Redis automatically expires session
 * keys. They are cleaned up whenever we perform a bulk invalidation.
 */
@Injectable()
export class RedisSessionManager extends SessionManager {
  private readonly userSessionPrefix = "auth:sessions:";
  private readonly sessionPrefix = "session:";

  constructor(
    @Inject("REDIS_CLIENT")
    private readonly redis: RedisClientType,
  ) {
    super();
  }

  async register(userId: string, sessionId: string): Promise<void> {
    await this.redis.sAdd(this.getUserSessionKey(userId), sessionId);
  }

  async unregister(userId: string, sessionId: string): Promise<void> {
    await this.redis.sRem(this.getUserSessionKey(userId), sessionId);
  }

  async destroyOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    const indexKey = this.getUserSessionKey(userId);
    const sessionIds = await this.redis.sMembers(indexKey);

    const otherSessionIds = sessionIds.filter(
      (sessionId) => sessionId !== currentSessionId,
    );

    if (otherSessionIds.length === 0) {
      return;
    }

    /**
     * Delete the actual Express session and its index entry together.
     *
     * Using one Redis MULTI operation keeps the cleanup atomic from Redis'
     * point of view and avoids issuing two independent commands per session.
     */
    const transaction = this.redis.multi();

    for (const sessionId of otherSessionIds) {
      transaction.del(this.getSessionKey(sessionId));
      transaction.sRem(indexKey, sessionId);
    }

    await transaction.exec();
  }

  private getUserSessionKey(userId: string): string {
    return `${this.userSessionPrefix}${userId}`;
  }

  private getSessionKey(sessionId: string): string {
    return `${this.sessionPrefix}${sessionId}`;
  }
}
