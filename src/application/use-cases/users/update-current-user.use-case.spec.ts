import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "@domain/entities/user.entity";
import {
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "@domain/exceptions/domain.exception";
import { UpdateCurrentUserUseCase } from "./update-current-user.use-case";
import { UserRole } from "@domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";

describe("UpdateCurrentUserUseCase", () => {
  const findById = jest.fn<() => Promise<User | null>>();
  const findByUserName = jest.fn<() => Promise<User | null>>();
  const save = jest.fn<(user: User) => Promise<User>>();

  const useCase = new UpdateCurrentUserUseCase({
    findById,
    findByUserName,
    save,
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates supplied profile fields and preserves omitted fields", async () => {
    const dateOfBirth = new Date("1990-01-01");

    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: "google",
      firstName: "Old",
      lastName: "Name",
      userName: "old_name",
      dateOfBirth,
      avatar: null,
      bio: null,
      status: UserStatus.ACTIVE,
    });

    findById.mockResolvedValue(existing);
    findByUserName.mockResolvedValue(null);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("userId", {
      firstName: "New",
      userName: "new_name",
    });

    expect(findById).toHaveBeenCalledWith("userId");
    expect(findByUserName).toHaveBeenCalledWith("new_name");
    expect(save).toHaveBeenCalledWith(existing);

    expect(result.firstName).toBe("New");
    expect(result.lastName).toBe("Name");
    expect(result.userName).toBe("new_name");
    expect(result.dateOfBirth).toEqual(dateOfBirth);

    expect(result.email).toBe("user@example.com");
    expect(result.googleId).toBe("google");
    expect(result.hashedPassword).toBe("hashed");
  });

  it("updates the bio", async () => {
    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Jane",
      lastName: "Doe",
      userName: "jane",
      dateOfBirth: null,
      avatar: null,
      bio: "Old bio",
      status: UserStatus.ACTIVE,
    });

    findById.mockResolvedValue(existing);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("id", {
      bio: "New bio",
    });

    expect(result.bio).toBe("New bio");
    expect(findByUserName).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(existing);
  });

  it("allows changing the username when it is unused", async () => {
    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Jane",
      lastName: "Doe",
      userName: "old_name",
      dateOfBirth: null,
      avatar: null,
      bio: null,
      status: UserStatus.ACTIVE,
    });

    findById.mockResolvedValue(existing);
    findByUserName.mockResolvedValue(null);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("id", {
      userName: "new_name",
    });

    expect(findByUserName).toHaveBeenCalledWith("new_name");
    expect(result.userName).toBe("new_name");
    expect(save).toHaveBeenCalledWith(existing);
  });

  it("allows keeping the current username", async () => {
    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Jane",
      lastName: "Doe",
      userName: "current_name",
      dateOfBirth: null,
      avatar: null,
      bio: null,
      status: UserStatus.ACTIVE,
    });

    findById.mockResolvedValue(existing);
    findByUserName.mockResolvedValue(existing);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("id", {
      userName: "current_name",
    });

    expect(findByUserName).toHaveBeenCalledWith("current_name");
    expect(result.userName).toBe("current_name");
    expect(save).toHaveBeenCalledWith(existing);
  });

  it("rejects changing the username to another user's username", async () => {
    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Jane",
      lastName: "Doe",
      userName: "old_name",
      dateOfBirth: null,
      avatar: null,
      bio: null,
      status: UserStatus.ACTIVE,
    });

    const otherUser = User.restore({
      id: "other-id",
      email: "other@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "John",
      lastName: "Doe",
      userName: "taken_name",
      dateOfBirth: null,
      avatar: null,
      bio: null,
      status: UserStatus.ACTIVE,
    });

    findById.mockResolvedValue(existing);
    findByUserName.mockResolvedValue(otherUser);

    await expect(
      useCase.execute("id", {
        userName: "taken_name",
      }),
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsException);

    expect(findByUserName).toHaveBeenCalledWith("taken_name");
    expect(save).not.toHaveBeenCalled();
    expect(existing.userName).toBe("old_name");
  });

  it("allows clearing nullable profile fields", async () => {
    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Jane",
      lastName: "Doe",
      userName: "jane",
      dateOfBirth: new Date("1990-01-01"),
      avatar: null,
      bio: "Bio",
      status: UserStatus.ACTIVE,
    });

    findById.mockResolvedValue(existing);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("id", {
      firstName: null,
      lastName: null,
      userName: null,
      dateOfBirth: null,
      bio: null,
    });

    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.userName).toBeNull();
    expect(result.dateOfBirth).toBeNull();
    expect(result.bio).toBeNull();

    expect(findByUserName).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(existing);
  });

  it("does not update avatar", async () => {
    const existing = User.restore({
      id: "id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Jane",
      lastName: "Doe",
      userName: "jane",
      dateOfBirth: null,
      avatar: null,
      bio: "Bio",
      status: UserStatus.ACTIVE,
    });

    existing.avatar = "avatar.jpg";
    findById.mockResolvedValue(existing);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute("id", {
      firstName: "Updated",
    });

    expect(result.firstName).toBe("Updated");
    expect(result.avatar).toBe("avatar.jpg");

    expect(findByUserName).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(existing);
  });

  it("rejects a missing user", async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute("missing", {
        userName: "new_name",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(findByUserName).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
