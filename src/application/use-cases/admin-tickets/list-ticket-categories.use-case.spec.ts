import { ListTicketCategoriesUseCase } from "./list-ticket-categories.use-case";

import { TicketCategory } from "@domain/entities/ticket-category.entity";
import { TicketCategoryRepository } from "@domain/repositories/ticket-category.repository";
import { PageResult } from "@shared/pagination/page-query";

describe("ListTicketCategoriesUseCase", () => {
  let useCase: ListTicketCategoriesUseCase;

  const ticketCategoryRepository = {
    findPage: jest.fn<
      Promise<PageResult<TicketCategory>>,
      [
        {
          page: number;
          limit: number;
          sortBy?: "createdAt" | "name";
          sortDirection?: "ASC" | "DESC";
        },
      ]
    >(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new ListTicketCategoriesUseCase(
      ticketCategoryRepository as unknown as TicketCategoryRepository,
    );
  });

  it("should return ticket categories", async () => {
    const result: PageResult<TicketCategory> = {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };

    ticketCategoryRepository.findPage.mockResolvedValue(result);

    const response = await useCase.execute({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(response).toBe(result);

    expect(ticketCategoryRepository.findPage).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });
  });

  it("should pass the provided pagination and sorting options", async () => {
    const result: PageResult<TicketCategory> = {
      data: [],
      total: 0,
      page: 2,
      limit: 10,
      totalPages: 0,
    };

    ticketCategoryRepository.findPage.mockResolvedValue(result);

    await useCase.execute({
      page: 2,
      limit: 10,
      sortBy: "name",
      sortDirection: "ASC",
    });

    expect(ticketCategoryRepository.findPage).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      sortBy: "name",
      sortDirection: "ASC",
    });
  });
});
