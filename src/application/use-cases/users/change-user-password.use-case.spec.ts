import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { UserNotFoundException } from "../../../domain/exceptions/domain.exception";
import { ChangeUserPasswordUseCase } from "./change-user-password.use-case";

describe("ChangeUserPasswordUseCase", () => {
  const findById = jest.fn<() => Promise<User | null>>();
  const hash = jest.fn<(password: string) => Promise<string>>();
  const save = jest.fn<(user: User) => Promise<User>>();

  const useCase = new ChangeUserPasswordUseCase(
    { findById, save } as any,
    { hash } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hashes and saves the new password without losing profile data", async () => {
    const dateOfBirth = new Date("1990-01-01");

    const user = new User(
      "id",
      "user@example.com",
      "old",
      UserRole.USER,
      true,
      new Date(),
      new Date(),
      "google",
      "Jane",
      "Doe",
      "jane",
      dateOfBirth,
      "avatar.webp",
      "Bio",
    );

    findById.mockResolvedValue(user);
    hash.mockResolvedValue("new-hash");
    save.mockResolvedValue(user);

    await expect(
      useCase.execute({
        userId: "id",
        password: "new-password",
      }),
    ).resolves.toBeUndefined();

    expect(findById).toHaveBeenCalledWith("id");

    expect(hash).toHaveBeenCalledWith("new-password");

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "id",
        email: "user@example.com",
        hashedPassword: "new-hash",
        role: UserRole.USER,
        emailVerified: true,
        googleId: "google",
        firstName: "Jane",
        lastName: "Doe",
        userName: "jane",
        dateOfBirth,
        avatar: "avatar.webp",
        bio: "Bio",
      }),
    );
  });

  it("rejects a missing user", async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "missing",
        password: "password",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);

    expect(hash).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
