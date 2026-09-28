/**
 * Application abstraction for protecting password authentication
 * against repeated failed attempts.
 *
 * The application layer receives the normalized account identifier and
 * client IP, but knows nothing about Redis or HTTP framework details.
 */
export abstract class LoginProtection {
  abstract isLocked(email: string, clientIp: string): Promise<boolean>;

  abstract recordFailure(email: string, clientIp: string): Promise<void>;

  abstract clear(email: string, clientIp: string): Promise<void>;
}
