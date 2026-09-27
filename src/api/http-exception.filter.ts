import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

import {
  CannotDeleteSelfException,
  CannotRemoveLastAdminException,
  DecimalScaleExceededException,
  DepositChangeStatusNotAllowedException,
  DepositCannotFailException,
  DepositIdempotencyConflictException,
  DepositNotFoundException,
  DomainException,
  FileNotFoundException,
  FieldMustExistException,
  GoogleAccountConflictException,
  InsufficientBalanceException,
  InvalidCredentialsException,
  InvalidDecimalValueException,
  InvalidDepositAmountException,
  InvalidLedgerEntryException,
  InvalidOtpException,
  InvalidUserBalanceException,
  InvalidWithdrawalAmountException,
  NotMatchException,
  OtpCooldownException,
  TicketAccessNotAllowedException,
  TicketCategoryNotFoundException,
  TicketClosedException,
  TicketMustAssignToAdminException,
  TicketNotFoundException,
  TicketStatusTransitionException,
  UnsupportedPaymentCurrencyException,
  UnsupportedPaymentProviderException,
  UserAlreadyExistsException,
  UserBalanceAlreadyExistsException,
  UserBalanceNotFoundException,
  UserNotFoundException,
  UsernameAlreadyExistsException,
  WithdrawalNotFoundException,
  WithdrawalStatusChangeNotAllowedException,
} from "@domain/exceptions/domain.exception";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status = this.statusFor(exception);
    const requestId =
      response.getHeader("X-Request-Id")?.toString() ?? "unknown";

    // Only unexpected 5xx errors are logged here.
    // Expected domain/application errors are normal API control flow.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
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
   * Domain exceptions stay independent from HTTP.
   * This API-layer mapping converts business/application failures
   * into the appropriate REST semantics.
   */
  private statusFor(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (!(exception instanceof DomainException)) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // Authentication
    if (
      exception instanceof InvalidCredentialsException ||
      exception instanceof InvalidOtpException
    ) {
      return HttpStatus.UNAUTHORIZED;
    }

    // Authorization
    if (exception instanceof TicketAccessNotAllowedException) {
      return HttpStatus.FORBIDDEN;
    }

    if (exception instanceof CannotDeleteSelfException) {
      return HttpStatus.FORBIDDEN;
    }

    // Resources that do not exist
    if (
      exception instanceof UserNotFoundException ||
      exception instanceof FileNotFoundException ||
      exception instanceof UserBalanceNotFoundException ||
      exception instanceof DepositNotFoundException ||
      exception instanceof WithdrawalNotFoundException ||
      exception instanceof TicketNotFoundException ||
      exception instanceof TicketCategoryNotFoundException
    ) {
      return HttpStatus.NOT_FOUND;
    }

    // Resource/state conflicts
    if (
      exception instanceof UserAlreadyExistsException ||
      exception instanceof UsernameAlreadyExistsException ||
      exception instanceof UserBalanceAlreadyExistsException ||
      exception instanceof GoogleAccountConflictException ||
      exception instanceof CannotRemoveLastAdminException ||
      exception instanceof DepositIdempotencyConflictException ||
      exception instanceof DepositChangeStatusNotAllowedException ||
      exception instanceof DepositCannotFailException ||
      exception instanceof WithdrawalStatusChangeNotAllowedException ||
      exception instanceof TicketClosedException ||
      exception instanceof TicketStatusTransitionException
    ) {
      return HttpStatus.CONFLICT;
    }

    // Rate limiting / temporal constraint
    if (exception instanceof OtpCooldownException) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }

    // Everything else represents invalid input or a business-rule
    // violation that the client can correct.
    if (
      exception instanceof FieldMustExistException ||
      exception instanceof NotMatchException ||
      exception instanceof InvalidUserBalanceException ||
      exception instanceof InsufficientBalanceException ||
      exception instanceof InvalidLedgerEntryException ||
      exception instanceof UnsupportedPaymentCurrencyException ||
      exception instanceof InvalidWithdrawalAmountException ||
      exception instanceof InvalidDepositAmountException ||
      exception instanceof TicketMustAssignToAdminException ||
      exception instanceof InvalidDecimalValueException ||
      exception instanceof DecimalScaleExceededException ||
      exception instanceof UnsupportedPaymentProviderException
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    // New domain exceptions default to 400 until explicitly classified.
    // This prevents an expected domain failure from becoming a misleading 500.
    return HttpStatus.BAD_REQUEST;
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

    return status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? "Internal server error"
      : "Request failed";
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

    return status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? "Internal Server Error"
      : "Error";
  }
}
