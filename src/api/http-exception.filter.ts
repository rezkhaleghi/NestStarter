import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  CannotRemoveLastAdminException,
  CannotDeleteSelfException,
  DomainException,
  InvalidCredentialsException,
  InvalidOtpException,
  GoogleAccountConflictException,
  UserAlreadyExistsException,
  UsernameAlreadyExistsException,
  UserNotFoundException,
  OtpCooldownException,
  UserBalanceNotFoundException,
} from "../domain/exceptions/domain.exception";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    const status = this.statusFor(exception);
    const requestId =
      response.getHeader("X-Request-Id")?.toString() ?? "unknown";

    /**
     * Log unexpected server errors with their stack trace.
     *
     * We deliberately do not expose the stack trace to the client.
     */
    if (status >= 500) {
      if (exception instanceof Error) {
        this.logger.error(
          `${request.method} ${request.url} - ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.error(
          `${request.method} ${request.url} - Unknown exception`,
          String(exception),
        );
      }
    }

    response.status(status).json({
      statusCode: status,
      message: this.messageFor(exception, status),
      error: this.errorFor(exception, status),
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Maps domain exceptions to HTTP status codes.
   *
   * Domain exceptions themselves know nothing about HTTP.
   * This keeps the domain layer independent from NestJS/API concerns.
   */
  private statusFor(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (!(exception instanceof DomainException)) {
      return 500;
    }

    if (exception instanceof InvalidCredentialsException) {
      return new UnauthorizedException().getStatus();
    }

    if (exception instanceof InvalidOtpException) {
      return new UnauthorizedException().getStatus();
    }

    if (exception instanceof GoogleAccountConflictException) {
      return new UnauthorizedException().getStatus();
    }

    if (exception instanceof UserNotFoundException) {
      return new NotFoundException().getStatus();
    }

    if (exception instanceof UserBalanceNotFoundException) {
      return new NotFoundException().getStatus();
    }

    if (
      exception instanceof UserAlreadyExistsException ||
      exception instanceof UsernameAlreadyExistsException ||
      exception instanceof CannotRemoveLastAdminException ||
      exception instanceof CannotDeleteSelfException
    ) {
      return new ConflictException().getStatus();
    }

    if (exception instanceof OtpCooldownException) {
      return 429;
    }

    // Unknown domain exceptions are treated as bad requests by default.
    return 400;
  }

  /**
   * Extracts a useful message from NestJS HTTP exceptions,
   * domain exceptions, or falls back to a generic message.
   */
  private messageFor(exception: unknown, status: number): string | string[] {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();

      if (typeof body === "string") {
        return body;
      }

      if (body && typeof body === "object" && "message" in body) {
        const message = (body as { message?: string | string[] }).message;

        if (message) {
          return message;
        }
      }
    }

    if (exception instanceof DomainException) {
      return exception.message;
    }

    return status >= 500 ? "Internal server error" : "Request failed";
  }

  /**
   * Returns a consistent error name for the API response.
   */
  private errorFor(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();

      if (body && typeof body === "object" && "error" in body) {
        const error = (body as { error?: string }).error;

        if (error) {
          return error;
        }
      }

      return exception.name;
    }

    if (exception instanceof DomainException) {
      return exception.name;
    }

    return status >= 500 ? "Internal Server Error" : "Error";
  }
}
