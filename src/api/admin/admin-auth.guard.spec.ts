import { ExecutionContext } from "@nestjs/common";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../domain/entities/user.entity";
import { UserRole } from "../../domain/enums/user-role.enum";
import { AdminAuthGuard } from "./admin-auth.guard";

describe("AdminAuthGuard", () => {
  const findById = jest.fn<() => Promise<User | null>>();

  const guard = new AdminAuthGuard({
    findById,
  } as any);

  const request = {
    session: {} as { userId?: string },
    user: undefined as unknown,
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
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

    expect(findById).toHaveBeenCalledWith("admin-id");
    expect(request.user).toBe(admin);
  });

  it("rejects a missing session", async () => {
    await expect(guard.canActivate(context)).rejects.toThrow();

    expect(findById).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });

  it("rejects a missing user", async () => {
    request.session.userId = "missing";
    findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow();

    expect(findById).toHaveBeenCalledWith("missing");
    expect(request.user).toBeUndefined();
  });

  it("rejects a regular user", async () => {
    const user = new User(
      "user-id",
      "user@example.com",
      "hashed",
      UserRole.USER,
    );

    request.session.userId = user.id;
    findById.mockResolvedValue(user);

    await expect(guard.canActivate(context)).rejects.toThrow();

    expect(findById).toHaveBeenCalledWith("user-id");
    expect(request.user).toBeUndefined();
  });
});
