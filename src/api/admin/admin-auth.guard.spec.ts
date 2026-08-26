import { ExecutionContext } from "@nestjs/common";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../domain/entities/user.entity";
import { UserRole } from "../../domain/enums/user-role.enum";
import { AdminAuthGuard } from "./admin-auth.guard";

describe("AdminAuthGuard", () => {
  const findById = jest.fn<() => Promise<User | null>>();
  const guard = new AdminAuthGuard({ findById } as any);
  const request = {
    session: {} as { userId?: string },
    user: undefined as unknown,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    request.session = {};
    request.user = undefined;
  });

  it("allows an administrator and attaches the user", async () => {
    const admin = new User(
      "admin-id",
      "admin@example.com",
      "hashed",
      UserRole.ADMIN,
    );
    request.session.userId = admin.id;
    findById.mockResolvedValue(admin);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBe(admin);
  });

  it("rejects a missing session or user", async () => {
    await expect(guard.canActivate(context)).rejects.toThrow();
    request.session.userId = "missing";
    findById.mockResolvedValue(null);
    await expect(guard.canActivate(context)).rejects.toThrow();
  });

  it("rejects a non-administrator", async () => {
    request.session.userId = "user-id";
    findById.mockResolvedValue(
      new User("user-id", "user@example.com", "hashed"),
    );
    await expect(guard.canActivate(context)).rejects.toThrow();
  });
});
