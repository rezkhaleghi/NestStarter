import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { User } from "../../../domain/entities/user.entity";
import { UserRole } from "../../../domain/enums/user-role.enum";
import {
  CannotDeleteSelfException,
  CannotRemoveLastAdminException,
  UserAlreadyExistsException,
  UserNotFoundException,
  UsernameAlreadyExistsException,
} from "../../../domain/exceptions/domain.exception";
import { CreateAdminUserUseCase } from "./create-user.use-case";
import { DeleteAdminUserUseCase } from "./delete-user.use-case";
import { GetUserUseCase } from "./get-user.use-case";
import { ListUsersUseCase } from "./list-users.use-case";
import { UpdateAdminUserUseCase } from "./update-user.use-case";

describe("admin user use cases", () => {
  const repository = {
    findById: jest.fn<() => Promise<User | null>>(),
    findByEmail: jest.fn<() => Promise<User | null>>(),
    findByUserName: jest.fn<() => Promise<User | null>>(),
    findPage: jest.fn<() => Promise<unknown>>(),
    save: jest.fn<(user: User) => Promise<User>>(),
    saveAdminMutation:
      jest.fn<(user: User, wasAdmin: boolean) => Promise<User | null>>(),
    deleteAdminUser: jest.fn<(id: string) => Promise<boolean>>(),
  };

  const hash = jest.fn<(password: string) => Promise<string>>();

  const auditLogger = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an admin user with a normalized email", async () => {
    repository.findByEmail.mockResolvedValue(null);
    hash.mockResolvedValue("hashed");

    repository.save.mockImplementation(async (user) => user);

    const useCase = new CreateAdminUserUseCase(
      repository as any,
      { hash } as any,
      auditLogger as any,
    );

    const result = await useCase.execute(
      {
        email: " ADMIN@example.com ",
        password: "password123",
        role: UserRole.ADMIN,
      },
      "admin-user-id",
    );

    expect(result.email).toBe("admin@example.com");
    expect(result.role).toBe(UserRole.ADMIN);
    expect(result.hashedPassword).toBe("hashed");

    expect(repository.findByEmail).toHaveBeenCalledWith("admin@example.com");

    expect(hash).toHaveBeenCalledWith("password123");

    expect(repository.save).toHaveBeenCalled();

    expect(auditLogger.log).toHaveBeenCalled();
  });

  it("rejects duplicate admin email", async () => {
    repository.findByEmail.mockResolvedValue(
      new User("id", "admin@example.com", "hashed", UserRole.ADMIN),
    );

    const useCase = new CreateAdminUserUseCase(
      repository as any,
      { hash } as any,
      auditLogger as any,
    );

    await expect(
      useCase.execute(
        {
          email: "admin@example.com",
          password: "password",
          role: UserRole.ADMIN,
        },
        "admin-user-id",
      ),
    ).rejects.toBeInstanceOf(UserAlreadyExistsException);

    expect(repository.save).not.toHaveBeenCalled();
    expect(auditLogger.log).not.toHaveBeenCalled();
  });

  it("gets and lists users through the repository", async () => {
    const user = new User("id", "user@example.com", "hashed");

    repository.findById.mockResolvedValue(user);

    const page = {
      data: [user],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    };

    repository.findPage.mockResolvedValue(page);

    await expect(
      new GetUserUseCase(repository as any).execute("id"),
    ).resolves.toBe(user);

    await expect(
      new ListUsersUseCase(repository as any).execute({
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(page);
  });

  it("rejects missing users", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      new GetUserUseCase(repository as any).execute("missing"),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("rejects deleting yourself and the last admin", async () => {
    repository.findById.mockResolvedValue(
      new User("id", "admin@example.com", "hashed", UserRole.ADMIN),
    );

    const useCase = new DeleteAdminUserUseCase(repository as any);

    await expect(useCase.execute("id", "id")).rejects.toBeInstanceOf(
      CannotDeleteSelfException,
    );

    repository.deleteAdminUser.mockResolvedValue(false);

    await expect(useCase.execute("id", "other")).rejects.toBeInstanceOf(
      CannotRemoveLastAdminException,
    );
  });

  it("updates profile data and protects duplicate usernames", async () => {
    const user = new User("id", "user@example.com", "old", UserRole.USER, true);

    repository.findById.mockResolvedValue(user);
    repository.findByUserName.mockResolvedValue(null);

    repository.saveAdminMutation.mockImplementation(async (updated) => updated);

    hash.mockResolvedValue("new-hash");

    const useCase = new UpdateAdminUserUseCase(
      repository as any,
      { hash } as any,
    );

    const result = await useCase.execute({
      id: "id",
      firstName: "Jane",
      userName: "jane",
    });

    expect(result.firstName).toBe("Jane");
    expect(result.userName).toBe("jane");

    repository.findByUserName.mockResolvedValue(
      new User("other", "other@example.com", "old"),
    );

    await expect(
      useCase.execute({
        id: "id",
        userName: "taken",
      }),
    ).rejects.toBeInstanceOf(UsernameAlreadyExistsException);
  });
});
