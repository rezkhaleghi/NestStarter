import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Response } from "express";
import {
  CannotRemoveLastAdminException,
  CannotDeleteSelfException,
  DomainException,
  InvalidCredentialsException,
  InvalidOtpException,
  GoogleAccountConflictException,
  UserAlreadyExistsException,
  UserNotFoundException,
  OtpCooldownException,
} from "../domain/exceptions/domain.exception";

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(exception);
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }

  private statusFor(exception: DomainException): number {
    if (exception instanceof InvalidCredentialsException) {
      return new UnauthorizedException().getStatus();
    }
    if (exception instanceof UserNotFoundException) {
      return new NotFoundException().getStatus();
    }
    if (exception instanceof UserAlreadyExistsException) {
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
}
