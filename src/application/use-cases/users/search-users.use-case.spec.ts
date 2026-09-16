import { SearchUsersUseCase } from "./search-users.use-case";
import { UserRepository } from "@domain/repositories/user.repository";
import { UserSearchResult } from "@domain/repositories/user-search-result";

describe("SearchUsersUseCase", () => {
  let useCase: SearchUsersUseCase;

  const userRepositoryMock = {
    search: jest.fn<
      Promise<UserSearchResult[]>,
      [string, Parameters<UserRepository["search"]>[1]]
    >(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new SearchUsersUseCase(
      userRepositoryMock as unknown as UserRepository,
    );
  });

  it("should search users and forward query and params", async () => {
    const query = "john";

    const params = {
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "DESC" as const,
    };

    const results: UserSearchResult[] = [
      {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        userName: "johndoe",
        avatar: null,
        bio: null,
        email: "user@example.com",
        dateOfBirth: null,
        createdAt: new Date(),
      },
    ];

    userRepositoryMock.search.mockResolvedValue(results);

    const result = await useCase.execute(query, params);

    expect(userRepositoryMock.search).toHaveBeenCalledWith(query, params);
    expect(result).toEqual(results);
  });

  it("should return an empty result when no users match", async () => {
    const params = {
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortDirection: "DESC" as const,
    };

    const results: UserSearchResult[] = [];

    userRepositoryMock.search.mockResolvedValue(results);

    const result = await useCase.execute("nonexistent", params);

    expect(userRepositoryMock.search).toHaveBeenCalledWith(
      "nonexistent",
      params,
    );
    expect(result).toEqual([]);
  });
});
