/**
 * Base class for all domain-level errors.
 * These represent business rule violations, not HTTP or infrastructure errors.
 * The API layer is responsible for translating these into proper HTTP responses.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class FieldMustExistException extends DomainException {
  constructor(field: string) {
    super(`Field "${field}" must exist.`);
  }
}

export class NotMatchException extends DomainException {
  constructor(field: string, entity: string) {
    super(`Field "${field}" does not match the ${entity}.`);
  }
}

export class InvalidOtpException extends DomainException {
  constructor() {
    super("The provided OTP is invalid or has expired.");
  }
}

export class OtpCooldownException extends DomainException {
  constructor() {
    super("Please wait before requesting another OTP.");
  }
}

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`A user with email "${email}" already exists.`);
  }
}

export class UsernameAlreadyExistsException extends DomainException {
  constructor(userName: string) {
    super(`A user with username "${userName}" already exists.`);
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super("Invalid email or password.");
  }
}

export class GoogleAccountConflictException extends DomainException {
  constructor() {
    super("This Google account cannot be linked to the requested user.");
  }
}

export class UserNotFoundException extends DomainException {
  constructor() {
    super("User not found.");
  }
}

export class CannotRemoveLastAdminException extends DomainException {
  constructor() {
    super("The last administrator cannot be removed or demoted.");
  }
}

export class CannotDeleteSelfException extends DomainException {
  constructor() {
    super("An administrator cannot delete their own account.");
  }
}

export class FileNotFoundException extends DomainException {
  constructor() {
    super("File not found.");
  }
}

//userBalance

export class UserBalanceNotFoundException extends DomainException {
  constructor(currency: string) {
    super(`Balance for ${currency} does not exist for this user.`);
  }
}

export class UserBalanceAlreadyExistsException extends DomainException {
  constructor(currency: string) {
    super(`A balance for ${currency} already exists for this user.`);
  }
}

export class InvalidUserBalanceException extends DomainException {
  constructor() {
    super("User balance amount must be positive.");
  }
}

export class InsufficientBalanceException extends DomainException {
  constructor() {
    super("Insufficient Balance!");
  }
}
export class InvalidLedgerEntryException extends DomainException {
  constructor() {
    super(
      "Invalid ledger entry: balanceBefore + amount must equal balanceAfter.",
    );
  }

export class UnsupportedPaymentCurrencyException extends DomainException {
  constructor(currency: string) {
    super(`Currency ${currency} is not supported by the payment provider.`);
  }
}

//withdrawal

export class InvalidWithdrawalAmountException extends DomainException {
  constructor() {
    super("Withdrawal amount must be positive.");
  }
}

export class WithdrawalNotFoundException extends DomainException {
  constructor() {
    super("Withdrawal not found.");
  }
}
export class WithdrawalNotPendingException extends DomainException {
  constructor() {
    super("Only PENDING withdrawals can be approved.");
  }
}

export class WithdrawalStatusChangeNotAllowedException extends DomainException {
  constructor(action: string, status: string) {
    super(`Withdrawal cannot be ${action} from ${status} status.`);
  }
}

//deposit

export class InvalidDepositAmountException extends DomainException {
  constructor() {
    super("Deposit amount must be positive.");
  }
}
export class DepositNotFoundException extends DomainException {
  constructor() {
    super("Deposit not found.");
  }
}
export class DepositChangeStatusNotAllowedException extends DomainException {
  constructor(status: string) {
    super(`Deposit status change is not allowed from ${status}.`);
  }
}

export class DepositCannotCancelException extends DomainException {
  constructor(status: string) {
    super(`Deposit cannot be cancelled from status ${status}.`);
  }
}

export class DepositCannotFailException extends DomainException {
  constructor(status: string) {
    super(`Deposit cannot be marked as failed from status ${status}.`);
  }
}

//ticket
export class TicketNotFoundException extends DomainException {
  constructor() {
    super("Ticket not found.");
  }
}

export class TicketCategoryNotFoundException extends DomainException {
  constructor() {
    super("Ticket category not found.");
  }
}

export class TicketMustAssignToAdminException extends DomainException {
  constructor() {
    super("Target user must be an admin/support user.");
  }
}
export class TicketClosedException extends DomainException {
  constructor() {
    super("This ticket is closed and cannot receive new replies.");
  }
}

export class TicketAccessNotAllowedException extends DomainException {
  constructor() {
    super("You cannot access this ticket.");
  }
}
