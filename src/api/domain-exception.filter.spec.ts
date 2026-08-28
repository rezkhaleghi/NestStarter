import { ArgumentsHost } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { HttpExceptionFilter } from "./http-exception.filter";
import { UserNotFoundException } from "../domain/exceptions/domain.exception";

describe("HttpExceptionFilter", () => {
  const filter = new HttpExceptionFilter();

  it("returns the stable response shape for domain errors", () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const setHeader = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, setHeader, getHeader: () => undefined }),
        getRequest: () => ({ url: "/users" }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new UserNotFoundException(), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "User not found.",
        error: "UserNotFoundException",
        path: "/users",
        requestId: expect.any(String),
      }),
    );
  });
});
