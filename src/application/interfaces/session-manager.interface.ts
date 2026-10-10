/**
 * Application abstraction for managing authenticated sessions.
 *
 * The application layer should not know that sessions are stored in Redis.
 * Infrastructure provides the concrete implementation.
 */
export abstract class SessionManager {
  /**
   * Associates an authenticated session with a user.
   */
  abstract register(userId: string, sessionId: string): Promise<void>;

  /**
   * Removes a session from the user's session index.
   *
   * This does not destroy the session itself. It is mainly used when the
   * session has already been destroyed by express-session.
   */
  abstract unregister(userId: string, sessionId: string): Promise<void>;

  /**
   * Destroys every known session belonging to the user except the current one.
   *
   * Keeping the current session alive gives the user the expected UX after
   * changing their own password while still invalidating other devices.
   */
  abstract destroyOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void>;

  /**
   * Destroys every known session belonging to the user.
   *
   * Used for security-sensitive operations such as an administrator
   * resetting a user's password.
   */
  abstract destroyAllSessions(userId: string): Promise<void>;
}
