export interface LoginUserInput {
  email: string;
  password: string;

  /**
   * Client address used to scope failed-login protection.
   *
   * The controller obtains this from Express's `req.ip`, which already
   * respects the configured reverse-proxy trust policy.
   */
  clientIp: string;
}
