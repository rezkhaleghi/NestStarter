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

export class InsufficientBalance extends DomainException {
  constructor() {
    super(`Insufficient Balance!`);
  }
}
