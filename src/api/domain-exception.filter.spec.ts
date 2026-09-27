import { ArgumentsHost } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";

import { HttpExceptionFilter } from "./http-exception.filter";
import {
  DepositIdempotencyConflictException,
  DepositNotFoundException,
  InvalidCredentialsException,
  TicketAccessNotAllowedException,
  TicketStatusTransitionException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

describe("HttpExceptionFilter", () => {
  const filter = new HttpExceptionFilter();

  function createHost(url = "/test") {
    const json = jest.fn();

    const status = jest.fn(() => ({
      json,
    }));

    const getHeader = jest.fn(() => undefined);

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status,
          getHeader,
        }),
        getRequest: () => ({
          method: "GET",
          url,
        }),
      }),
    } as unknown as ArgumentsHost;

    return {
      host,
      status,
      json,
    };
  }

  it("maps not-found domain exceptions to 404", () => {
    const { host, status, json } = createHost("/users/123");

    filter.catch(new UserNotFoundException(), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "User not found.",
        error: "UserNotFoundException",
      }),
    );
  });

  it("maps deposit not-found exceptions to 404", () => {
    const { host, status } = createHost("/deposits/123");

    filter.catch(new DepositNotFoundException(), host);

    expect(status).toHaveBeenCalledWith(404);
  });

  it("maps authentication failures to 401", () => {
    const { host, status } = createHost("/auth/login");

    filter.catch(new InvalidCredentialsException(), host);

    expect(status).toHaveBeenCalledWith(401);
  });

  it("maps authorization failures to 403", () => {
    const { host, status } = createHost("/tickets/123");

    filter.catch(new TicketAccessNotAllowedException(), host);

    expect(status).toHaveBeenCalledWith(403);
  });

  it("maps duplicate resources to 409", () => {
    const { host, status } = createHost("/users");

    filter.catch(new UserAlreadyExistsException("test@example.com"), host);

    expect(status).toHaveBeenCalledWith(409);
  });

  it("maps idempotency conflicts to 409", () => {
    const { host, status } = createHost("/deposits");

    filter.catch(new DepositIdempotencyConflictException(), host);

    expect(status).toHaveBeenCalledWith(409);
  });

  it("maps invalid state transitions to 409", () => {
    const { host, status } = createHost("/tickets/123");

    filter.catch(new TicketStatusTransitionException("closed", "open"), host);

    expect(status).toHaveBeenCalledWith(409);
  });

  it("keeps the stable response shape", () => {
    const { host, status, json } = createHost("/users");

    filter.catch(new UserNotFoundException(), host);

    expect(status).toHaveBeenCalledWith(404);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "User not found.",
        error: "UserNotFoundException",
        requestId: "unknown",
        path: "/users",
        timestamp: expect.any(String),
      }),
    );
  });
});
