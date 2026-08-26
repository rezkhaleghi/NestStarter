import { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "@jest/globals";
import { AuthSessionGuard } from "./auth-session.guard";

describe("AuthSessionGuard", () => {
  const guard = new AuthSessionGuard();
  const context = (session: object): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ session }) }),
    }) as ExecutionContext;

  it("allows an authenticated session", () => {
    expect(guard.canActivate(context({ userId: "user-id" }))).toBe(true);
  });

  it("rejects an unauthenticated session", () => {
    expect(() => guard.canActivate(context({}))).toThrow();
  });
});
