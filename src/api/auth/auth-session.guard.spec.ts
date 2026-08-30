import { ExecutionContext } from "@nestjs/common";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { User } from "../../domain/entities/user.entity";
import { UserStatus } from "../../domain/enums/user-status.enum";
import { AuthSessionGuard } from "./auth-session.guard";

describe("AuthSessionGuard", () => {
  const findById = jest.fn<() => Promise<User | null>>();

  const userRepository = {
    findById,
  };

  const guard = new AuthSessionGuard(userRepository as any);

  const context = (session: object): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          session,
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows an authenticated active user", async () => {
    const user = new User("user-id", "user@example.com", "hashed-password");

    findById.mockResolvedValue(user);

    await expect(
      guard.canActivate(context({ userId: "user-id" })),
    ).resolves.toBe(true);

    expect(findById).toHaveBeenCalledWith("user-id");
  });

  it("rejects an unauthenticated session", async () => {
    await expect(guard.canActivate(context({}))).rejects.toThrow();

    expect(findById).not.toHaveBeenCalled();
  });

  it("rejects a missing user", async () => {
    findById.mockResolvedValue(null);

    await expect(
      guard.canActivate(context({ userId: "missing-user" })),
    ).rejects.toThrow();

    expect(findById).toHaveBeenCalledWith("missing-user");
  });

  it("rejects a restricted user", async () => {
    const user = new User("user-id", "user@example.com", "hashed-password");

    user.restrict();

    expect(user.status).toBe(UserStatus.RESTRICTED);

    findById.mockResolvedValue(user);

    await expect(
      guard.canActivate(context({ userId: "user-id" })),
    ).rejects.toThrow();

    expect(findById).toHaveBeenCalledWith("user-id");
  });
});
