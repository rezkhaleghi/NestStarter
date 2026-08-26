export abstract class LoginProtection {
  abstract isLocked(identifier: string): Promise<boolean>;
  abstract recordFailure(identifier: string): Promise<void>;
  abstract clear(identifier: string): Promise<void>;
}
