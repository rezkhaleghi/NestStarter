import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { UserAlreadyExistsException } from "../../../domain/exceptions/domain.exception";
import { CreateUserUseCase } from "./create-user.use-case";

describe("CreateUserUseCase", () => {
  const findByEmail = jest.fn<() => Promise<User | null>>();
  const hash = jest.fn<(password: string) => Promise<string>>();
  const save = jest.fn<(user: User) => Promise<User>>();
  const useCase = new CreateUserUseCase(
    { findByEmail, save } as any,
    { hash } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes, hashes, verifies, and saves a new user", async () => {
    findByEmail.mockResolvedValue(null);
    hash.mockResolvedValue("hashed");
    save.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      email: " USER@example.com ",
      password: "password",
    });

    expect(result.email).toBe("user@example.com");
    expect(result.hashedPassword).toBe("hashed");
    expect(result.emailVerified).toBe(true);
    expect(save).toHaveBeenCalled();
  });

  it("rejects an existing email", async () => {
    findByEmail.mockResolvedValue(new User("id", "user@example.com", "hashed"));
    await expect(
      useCase.execute({ email: "user@example.com", password: "password" }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsException);
    expect(hash).not.toHaveBeenCalled();
  });
});
