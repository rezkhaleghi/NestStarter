import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
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
} from "../domain/exceptions/domain.exception";

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = this.statusFor(exception);
    const requestId = response.getHeader("X-Request-Id") ?? randomUUID();
    const message = this.messageFor(exception, status);
    response.setHeader("X-Request-Id", requestId);
    response.status(status).json({
      statusCode: status,
      message,
      error: this.errorFor(exception, status),
      requestId,
      path: request.url,
    });
  }

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
    if (exception instanceof UserNotFoundException) {
      return new NotFoundException().getStatus();
    }
    if (exception instanceof UserAlreadyExistsException) {
      return new ConflictException().getStatus();
    }
    if (exception instanceof UsernameAlreadyExistsException) {
      return new ConflictException().getStatus();
    }
    if (exception instanceof InvalidOtpException) {
      return new UnauthorizedException().getStatus();
    }
    if (exception instanceof GoogleAccountConflictException) {
      return new UnauthorizedException().getStatus();
    }
    if (
      exception instanceof CannotRemoveLastAdminException ||
      exception instanceof CannotDeleteSelfException
    ) {
      return 409;
    }
    if (exception instanceof OtpCooldownException) {
      return 429;
    }
    return 400;
  }

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
