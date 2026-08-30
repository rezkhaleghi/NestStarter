import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import { GoogleAuthUseCase } from "./google-auth.use-case";

describe("GoogleAuthUseCase", () => {
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const findByGoogleId = jest.fn<() => Promise<User | null>>();
  const save = jest.fn<(user: User) => Promise<User>>();

  const repository = {
    findByEmail,
    findByGoogleId,
    save,
  };

  const useCase = new GoogleAuthUseCase(repository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an account already linked to Google", async () => {
    const user = new User(
      "user-id",
      "user@example.com",
      null,
      UserRole.USER,
      true,
      new Date(),
      new Date(),
      "google-id",
    );

    findByGoogleId.mockResolvedValue(user);

    await expect(
      useCase.execute({
        email: "other@example.com",
        googleId: "google-id",
      }),
    ).resolves.toBe(user);

    expect(findByGoogleId).toHaveBeenCalledWith("google-id");
    expect(findByEmail).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("links and verifies an existing local account", async () => {
    const user = new User("user-id", "user@example.com", "hashed-password");

    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(user);
    save.mockResolvedValue(user);

    await expect(
      useCase.execute({
        email: " USER@example.com ",
        googleId: "google-id",
      }),
    ).resolves.toBe(user);

    expect(findByGoogleId).toHaveBeenCalledWith("google-id");
    expect(findByEmail).toHaveBeenCalledWith("user@example.com");

    expect(user.googleId).toBe("google-id");
    expect(user.emailVerified).toBe(true);

    expect(save).toHaveBeenCalledWith(user);
  });

  it("creates a verified Google account when no account exists", async () => {
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(null);
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      email: " USER@example.com ",
      googleId: "google-id",
    });

    expect(result.email).toBe("user@example.com");
    expect(result.googleId).toBe("google-id");
    expect(result.emailVerified).toBe(true);
    expect(result.role).toBe(UserRole.USER);
    expect(result.hashedPassword).toBeNull();

    expect(findByGoogleId).toHaveBeenCalledWith("google-id");
    expect(findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(save).toHaveBeenCalledWith(result);
  });
});
