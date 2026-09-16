# NestStarter

A production-oriented **NestJS backend boilerplate built around Clean Architecture**.

NestStarter provides the backend foundations that many applications repeatedly need:

- Clean Architecture
- Authentication and authorization
- Session-based authentication with Redis
- Password and OTP authentication
- Google OAuth
- User management
- Administrative user management
- File storage and image processing
- PostgreSQL and TypeORM
- Transactional workflows through Unit of Work
- Financial balances and immutable ledgers
- Deposits and withdrawals
- Payment-provider abstraction
- Customer support tickets
- Ticket categories
- Administrative auditing
- Validation and rate limiting
- Health checks
- Swagger/OpenAPI
- Docker and Docker Compose
- TypeORM migrations
- Automated tests

The goal is simple:

> **Start with a solid backend foundation, keep business logic independent from frameworks and infrastructure, and spend your time building the actual product.**

---

# Why NestStarter?

Most NestJS applications begin with controllers, services, database entities, and modules. As the application grows, business logic can become tightly coupled to NestJS, TypeORM, Redis, HTTP, and other infrastructure concerns.

NestStarter takes a different approach.

The application is organized around **domain rules and use cases**, while frameworks and external services are treated as implementation details.

This provides:

- Clear separation of responsibilities
- Framework-independent domain logic
- Focused use cases
- Explicit dependencies
- Replaceable infrastructure
- Transactional workflows
- Centralized error handling
- Global validation
- Authentication and authorization foundations
- Administrative auditing
- Financial balance and ledger tracking
- Deposit and withdrawal workflows
- Ticket/support workflows
- File-storage and image-processing abstractions

NestStarter is intentionally **not a complete application**. It provides a reusable backend foundation on which a product can be built.

---

# Architecture

NestStarter follows a four-layer Clean Architecture structure:

```text
src/

├── api/
│
├── application/
│
├── domain/
│
└── infrastructure/
```

The dependency direction is:

```text
API
 │
 ▼
Application
 │
 ▼
Domain

Infrastructure
      │
      └──────► Application / Domain
```

The important rule is that business logic does not depend on infrastructure.

For example:

```text
Controller
    │
    ▼
Use Case
    │
    ▼
Repository Interface
    ▲
    │
Repository Implementation
    │
    ▼
TypeORM / PostgreSQL
```

The application knows about the repository contract.

It does not need to know that PostgreSQL and TypeORM are being used underneath.

---

# Project Structure

The major source directories are:

```text
src/

├── api/
│   ├── admin/
│   ├── auth/
│   ├── files/
│   ├── health/
│   └── users/
│
├── application/
│   ├── dtos/
│   ├── interfaces/
│   └── use-cases/
│       ├── admin-financials/
│       ├── admin-tickets/
│       ├── admin-users/
│       ├── auth/
│       ├── deposits/
│       ├── tickets/
│       ├── users/
│       └── withdrawals/
│
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── exceptions/
│   ├── repositories/
│   └── utils/
│
├── infrastructure/
│   ├── auth/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   ├── orm-entities/
│   │   └── repositories/
│   └── services/
│
├── shared/
│   └── pagination/
│
└── types/
```

---

# Domain Layer

The domain contains business concepts, state, rules, enums, exceptions, repository contracts, and domain utilities.

```text
domain/

├── entities/
├── enums/
├── exceptions/
├── repositories/
└── utils/
```

The domain does not depend on NestJS, TypeORM, Express, Redis, MinIO, or PostgreSQL.

---

# Domain Entities

The current domain contains the following major entities:

```text
User
UserBalance
Ledger
AuditLog

Deposit
Withdrawal

Ticket
TicketMessage
TicketCategory
```

## User

The `User` entity represents application users.

Important state includes:

```text
id
email
hashedPassword
role
status
emailVerified
googleId

firstName
lastName
userName
dateOfBirth
avatar
bio

createdAt
updatedAt
```

The entity contains domain operations for changing business state, including:

```text
update()
changeEmail()
changeRole()
setEmailVerified()
changePassword()
verifyEmail()
linkGoogleAccount()
activate()
restrict()
```

Ordinary profile fields are updated through the domain update operation, while fields with special business meaning use dedicated domain methods.

The domain entity is independent from the database ORM.

---

# UserBalance

`UserBalance` represents the current balance of a user for a specific payment currency.

```text
UserBalance

├── id
├── userId
├── currency
└── amount
```

The balance represents **current state**.

It is not intended to be the historical record of financial activity.

Balances are stored using decimal strings rather than JavaScript floating-point numbers.

---

# Ledger

`Ledger` represents an immutable financial record describing a balance movement.

```text
Ledger

├── id
├── userId
├── currency
├── amount
├── balanceBefore
├── balanceAfter
├── type
├── actorUserId
├── referenceId
├── metadata
└── createdAt
```

For example:

```text
Balance before: 1500.50
Movement:        -500.00
Balance after:  1000.50
```

The ledger records:

```text
amount        = -500.00
balanceBefore = 1500.50
balanceAfter  = 1000.50
```

The current balance and historical ledger intentionally have different responsibilities:

```text
UserBalance
    │
    └── Current financial state

Ledger
    │
    └── Historical financial movements
```

---

# AuditLog

`AuditLog` represents an immutable record of an important application or administrative action.

```text
AuditLog

├── id
├── actorUserId
├── targetUserId
├── action
├── metadata
└── createdAt
```

Audit logs are created through the domain factory:

```ts
AuditLog.create({
  actorUserId,
  targetUserId,
  action,
  metadata,
});
```

Transactional operations can create audit records through the transaction-scoped `AuditLogRepository`.

---

# Deposit

`Deposit` represents an incoming payment.

```text
Deposit

├── id
├── userId
├── currency
├── amount
├── status
├── referenceId
├── providerPaymentId
├── transactionId
├── createdAt
├── updatedAt
└── completedAt
```

Deposit statuses currently include:

```text
PENDING
COMPLETED
FAILED
CANCELLED
```

The domain controls valid state changes such as:

```text
PENDING → COMPLETED
PENDING → FAILED
PENDING → CANCELLED
```

A deposit has both an application-generated `referenceId` and an optional provider payment identifier.

---

# Withdrawal

`Withdrawal` represents a user's withdrawal request.

```text
Withdrawal

├── id
├── userId
├── currency
├── amount
├── status
├── destination
├── referenceId
├── providerWithdrawalId
├── transactionId
├── rejectionReason
├── createdAt
├── updatedAt
└── completedAt
```

Current withdrawal statuses are:

```text
PENDING
APPROVED
PROCESSING
COMPLETED
FAILED
REJECTED
CANCELLED
```

The domain controls valid state transitions.

The current administrative workflow is intentionally simple:

```text
User creates withdrawal
        │
        ▼
     PENDING
      /    \
     /      \
APPROVED   REJECTED
             │
             ▼
          REFUND
```

The future provider-oriented lifecycle can support:

```text
APPROVED
    │
    ▼
PROCESSING
    │
    ├──► COMPLETED
    │
    └──► FAILED
```

The provider-specific processing workflow can be extended when a real payment provider is integrated.

---

# Ticket

`Ticket` represents a customer-support request.

```text
Ticket

├── id
├── userId
├── categoryId
├── subject
├── status
├── priority
├── assignedToUserId
├── createdAt
├── updatedAt
└── closedAt
```

Ticket status currently includes:

```text
OPEN
IN_PROGRESS
WAITING_FOR_USER
WAITING_FOR_SUPPORT
RESOLVED
CLOSED
```

The domain enforces valid status transitions.

For example:

```text
OPEN
  │
  ├──► IN_PROGRESS
  ├──► WAITING_FOR_SUPPORT
  └──► CLOSED
```

and:

```text
IN_PROGRESS
  │
  ├──► WAITING_FOR_USER
  ├──► WAITING_FOR_SUPPORT
  ├──► RESOLVED
  └──► CLOSED
```

Invalid transitions are rejected by the domain.

---

# TicketMessage

`TicketMessage` represents a message belonging to a support ticket.

Messages can be created by users or administrators through their respective application workflows.

The ticket domain also exposes whether a ticket can currently receive replies.

---

# TicketCategory

`TicketCategory` represents a support-ticket category.

```text
TicketCategory

├── id
├── name
├── description
├── isActive
├── createdAt
└── updatedAt
```

Categories can be:

```text
created
updated
activated
deactivated
```

Deactivation is used instead of removing a category from the system when the category should no longer be available for normal use.

---

# Domain Entity Factories

Domain entities use factory methods for normal creation.

For example:

```ts
User.create({
  email,
  hashedPassword,
});
```

```ts
UserBalance.create({
  userId,
  currency,
  amount,
});
```

```ts
Ledger.create({
  userId,
  currency,
  amount,
  balanceBefore,
  balanceAfter,
  type,
});
```

```ts
Deposit.create({
  userId,
  currency,
  amount,
});
```

```ts
Withdrawal.create({
  userId,
  currency,
  amount,
  destination,
});
```

```ts
Ticket.create({
  userId,
  subject,
  categoryId,
});
```

```ts
TicketCategory.create({
  name,
  description,
});
```

Factories provide named construction parameters, sensible defaults, and a central place for creation rules.

Entity IDs are generated by the domain when an ID is not explicitly supplied.

This keeps identity generation consistent across the domain and persistence layers.

---

# Domain Enums

Important domain enums include:

```text
UserRole
UserStatus

AuditAction

PaymentCurrency
PaymentProvider

LedgerType

DepositStatus
WithdrawalStatus

TicketStatus
TicketPriority
```

Ledger types currently include:

```text
ADMIN_ADJUSTMENT
DEPOSIT
WITHDRAWAL
TRANSFER_IN
TRANSFER_OUT
REFUND
```

User roles currently include:

```text
USER
ADMIN
```

---

# Domain Exceptions

Business errors are represented by domain exceptions rather than HTTP exceptions.

Examples include:

```text
InvalidCredentialsException
InvalidOtpException
OtpCooldownException

UserAlreadyExistsException
UsernameAlreadyExistsException
UserNotFoundException

UserBalanceAlreadyExistsException
UserBalanceNotFoundException
InsufficientBalanceException

InvalidDepositAmountException
InvalidWithdrawalAmountException
UnsupportedPaymentCurrencyException

DepositNotFoundException
WithdrawalNotFoundException

WithdrawalStatusChangeNotAllowedException
DepositChangeStatusNotAllowedException

CannotRemoveLastAdminException
CannotDeleteSelfException

TicketNotFoundException
TicketMessageNotFoundException
TicketStatusTransitionException

TicketCategoryNotFoundException

GoogleAccountConflictException
```

All domain exceptions inherit from the application's domain exception base.

The domain does not know about HTTP status codes.

The API layer translates application/domain failures into HTTP responses.

---

# Repository Contracts

Repository contracts live outside the infrastructure implementation.

Current repository responsibilities cover:

```text
UserRepository
UserBalanceRepository
LedgerRepository
AuditLogRepository

DepositRepository
WithdrawalRepository

TicketRepository
TicketMessageRepository
TicketCategoryRepository
```

Infrastructure provides TypeORM-based implementations.

Repositories are responsible for persistence and data access.

Business workflows remain in the application layer and domain entities.

---

# Decimal Arithmetic

Financial values are represented as strings rather than JavaScript floating-point numbers.

The project provides decimal utilities including:

```text
addDecimal()
subtractDecimal()
isNegativeDecimal()
isZeroDecimal()
```

The arithmetic implementation uses `BigInt` internally to avoid JavaScript floating-point precision problems.

For example:

```ts
addDecimal("1500.50", "-500.25");

// "1000.25"
```

and:

```ts
subtractDecimal("2000", "550.25");

// "1449.75"
```

This is particularly important for balances, deposits, withdrawals, refunds, and ledger calculations.

---

# Application Layer

The application layer contains use cases and interfaces.

```text
application/

├── dtos/
├── interfaces/
└── use-cases/
```

A use case represents a meaningful operation the application can perform.

---

# Use-Case-Oriented Design

Instead of a large generic service containing unrelated operations, NestStarter uses focused use cases.

Examples include:

```text
CreateUserUseCase
GetCurrentUserUseCase
UpdateCurrentUserUseCase
ChangeUserPasswordUseCase

SearchUsersUseCase

UpdateUserAvatarUseCase
DeleteUserAvatarUseCase

UpdateUserBalanceUseCase
```

Financial use cases include:

```text
CreateDepositUseCase
VerifyDepositUseCase

CreateWithdrawalUseCase

AdminApproveWithdrawalUseCase
AdminRejectWithdrawalUseCase

AdminListDepositsUseCase
AdminGetDepositUseCase

AdminListWithdrawalsUseCase
AdminGetWithdrawalUseCase
```

Ticket use cases include operations for:

```text
Creating tickets
Viewing tickets
Listing tickets
Creating messages
Assigning tickets
Changing ticket status
Changing priority

Creating categories
Updating categories
Deactivating categories
Listing categories
```

This structure makes individual operations easier to understand, authorize, test, and audit.

---

# Unit of Work

NestStarter provides a `UnitOfWork` abstraction for workflows that require multiple related database operations to succeed or fail together.

The application depends on:

```text
UnitOfWork
```

rather than directly depending on TypeORM transactions.

A transaction exposes transaction-scoped repositories:

```text
UnitOfWork
    │
    ▼
TypeOrmUnitOfWork
    │
    ▼
TypeORM EntityManager
    │
    ├── UserRepository
    ├── UserBalanceRepository
    ├── LedgerRepository
    ├── AuditLogRepository
    ├── DepositRepository
    ├── WithdrawalRepository
    ├── TicketRepository
    ├── TicketMessageRepository
    └── TicketCategoryRepository
```

Example:

```ts
return this.unitOfWork.execute(
  async ({
    userRepository,
    userBalanceRepository,
    ledgerRepository,
    auditLogRepository,
  }) => {
    // transactional workflow
  },
);
```

The concrete transaction implementation remains inside infrastructure.

---

# Transactional Workflows

Financial mutations use transaction boundaries around related database operations.

For example, a withdrawal request performs:

```text
BEGIN

  Load user
  Lock balance
  Validate amount
  Validate sufficient balance

  Decrease balance
  Create withdrawal
  Create ledger
  Create audit log

COMMIT
```

If any database operation fails:

```text
ROLLBACK
```

This prevents partially completed financial mutations.

---

# Row Locking and Concurrent Financial Operations

Mutable financial records are loaded with database locks where concurrent operations could otherwise race.

For example:

```text
findByUserIdAndCurrencyForUpdate()
```

is used when modifying a user's balance.

Withdrawal and deposit operations also lock the relevant financial records before applying state changes.

This is important for scenarios such as:

```text
Request A ──┐
            ├──► same user balance
Request B ──┘
```

The transaction and row-locking strategy prevents both requests from incorrectly operating on the same stale balance.

---

# User Balance Operations

Administrative balance adjustments use signed amounts.

For example:

```text
Current balance: 2000

Adjustment: +500

Result: 2500
```

or:

```text
Current balance: 2000

Adjustment: -500

Result: 1500
```

The adjustment is a movement, not a target balance.

The workflow:

1. Validates the target user
2. Loads/locks the balance
3. Calculates the resulting balance
4. Rejects a negative resulting balance
5. Creates or updates the balance
6. Creates a ledger record
7. Creates an audit record

The financial database writes occur inside one transaction.

---

# Withdrawals

A user can create a withdrawal request.

The request contains:

```text
currency
amount
destination
```

When created:

```text
User Balance
     │
     └── amount is reserved/deducted

Withdrawal
     │
     └── PENDING

Ledger
     │
     └── WITHDRAWAL

AuditLog
     │
     └── WITHDRAWAL_REQUESTED
```

The user's balance is reduced when the withdrawal is created.

---

# Administrative Withdrawal Workflow

The current administrative workflow intentionally has two actions:

```text
Approve
Reject
```

## Approve

An administrator can approve a pending withdrawal:

```text
PENDING
   │
   ▼
APPROVED
```

The approval is transactional and audit logged.

The current implementation does **not** require an additional administrator "processing" or "failed" action.

Those states exist in the domain to support a future real provider workflow.

---

## Reject

When an administrator rejects a pending withdrawal:

```text
PENDING
   │
   ▼
REJECTED
   │
   ▼
REFUND
```

The rejection workflow:

1. Locks the withdrawal
2. Changes its state to `REJECTED`
3. Locks the user's balance
4. Refunds the withdrawal amount
5. Creates a `REFUND` ledger entry
6. Saves the withdrawal
7. Creates an audit record

All database operations execute in one transaction.

---

# Deposits

Deposits use a provider abstraction rather than coupling the application directly to a payment provider SDK.

The basic flow is:

```text
Create Deposit
      │
      ▼
   PENDING
      │
      ▼
Payment Provider
      │
      ▼
Provider Payment ID
      │
      ▼
Verify Payment
      │
      ▼
   COMPLETED
      │
      ├── Update Balance
      ├── Create Ledger
      └── Create AuditLog
```

Deposit creation stores the application deposit first.

The external provider operation happens outside the database transaction.

After the provider returns a payment identifier, the deposit is updated in a separate transaction.

This prevents a slow external provider call from keeping a database transaction open.

---

# Payment Provider Abstraction

The application uses:

```text
PaymentProviderInterface
```

instead of directly depending on a provider SDK.

The abstraction supports operations such as:

```text
createPayment()
verifyPayment()

createWithdrawal()
getWithdrawalStatus()
```

Provider results contain provider-specific identifiers while the application keeps its own `referenceId`.

This makes it possible to replace the provider implementation without rewriting the application workflows.

The current repository includes a fake payment provider for development/testing.

It is intentionally not a real payment gateway.

A real provider can later implement the same application interface.

---

# Financial Provider Integration

The payment abstraction is designed to support providers such as:

```text
Bank/payment gateway
Crypto payment provider
International payment provider
Other external payment service
```

The provider implementation belongs in infrastructure.

The application layer should only depend on the provider interface.

A production integration should additionally account for provider-specific:

- Idempotency
- Webhooks/callbacks
- Reconciliation
- Provider failures
- Provider timeouts
- Duplicate callbacks
- Transaction verification
- Provider-side withdrawal state

---

# Ledger

Every financial balance mutation should have a corresponding ledger movement.

Examples:

```text
ADMIN_ADJUSTMENT
DEPOSIT
WITHDRAWAL
REFUND
```

A ledger record contains:

```text
amount
balanceBefore
balanceAfter
```

Example:

```text
Ledger #1

amount        = +1500
balanceBefore = 0
balanceAfter  = 1500
```

followed by:

```text
Ledger #2

amount        = -500
balanceBefore = 1500
balanceAfter  = 1000
```

The current balance is:

```text
1000
```

while the ledger retains the historical movements.

---

# Admin Financial APIs

Administrators can inspect financial records.

Deposit administration provides:

```text
GET /admin/deposits
GET /admin/deposits/:id
```

Withdrawal administration provides:

```text
GET /admin/withdrawals
GET /admin/withdrawals/:id

PATCH /admin/withdrawals/:id/approve
PATCH /admin/withdrawals/:id/reject
```

Administrative financial listings support filtering, pagination, and sorting.

Typical filters include:

```text
userId
currency
status
referenceId
providerPaymentId
providerWithdrawalId
from
to
```

Sorting supports fields such as:

```text
createdAt
amount
```

Administrative financial routes are protected by `AdminAuthGuard`.

---

# Tickets and Customer Support

NestStarter includes a complete support-ticket foundation.

Users can create and interact with their own tickets.

Administrators can manage tickets globally.

The ticket system supports:

```text
Tickets
Ticket messages
Ticket categories
Assignment
Priority
Status transitions
Administrative replies
Category management
```

---

# User Ticket Operations

The user-side ticket workflow supports operations such as:

```text
Create ticket
List own tickets
Get own ticket
Create ticket message
```

User ticket access is scoped to the authenticated user's session.

A user cannot retrieve another user's ticket simply by changing a ticket ID.

---

# Administrative Ticket Operations

Administrators can:

```text
List tickets
View ticket details
Reply to tickets
Assign tickets
Change ticket status
Change ticket priority

List categories
Create categories
Update categories
Deactivate categories
```

The administrator's authenticated session is used as the audit actor.

For example:

```text
Admin session
     │
     ▼
AdminTicketsController
     │
     ▼
UseCase(actorUserId)
     │
     ▼
Domain operation
     │
     ▼
AuditLog
```

---

# Ticket Status Rules

Ticket status changes are controlled by the domain entity.

The current states are:

```text
OPEN
IN_PROGRESS
WAITING_FOR_USER
WAITING_FOR_SUPPORT
RESOLVED
CLOSED
```

The entity validates transitions instead of allowing arbitrary status changes.

This prevents invalid state changes from being implemented accidentally in controllers.

---

# Ticket Categories

Administrators can manage support categories.

Available operations include:

```text
GET    /admin/tickets/categories
POST   /admin/tickets/categories
PATCH  /admin/tickets/categories/:id
PATCH  /admin/tickets/categories/:id/deactivate
```

Category mutations include the administrator's session ID so that the action can be audited.

---

# Audit Logging

Administrative and important application operations are audit logged.

The audit system contains:

```text
AuditLog entity
AuditLogRepository
AuditAction enum
AuditLogger abstraction
```

Important financial and administrative workflows create audit records as part of their transaction when appropriate.

Current audit actions include categories such as:

```text
USER_CREATED
USER_UPDATED
USER_DELETED
USER_PASSWORD_CHANGED
USER_AVATAR_DELETED
USER_ROLE_CHANGED

USER_BALANCE_CREATED
USER_BALANCE_UPDATED

DEPOSIT_CREATED
DEPOSIT_COMPLETED
DEPOSIT_FAILED
DEPOSIT_CANCELLED

WITHDRAWAL_REQUESTED
WITHDRAWAL_APPROVED
WITHDRAWAL_REJECTED
WITHDRAWAL_PROCESSING
WITHDRAWAL_COMPLETED
WITHDRAWAL_FAILED
WITHDRAWAL_REFUNDED

TICKET_CREATED
TICKET_MESSAGE_CREATED
TICKET_STATUS_CHANGED
TICKET_PRIORITY_CHANGED
TICKET_ASSIGNED
TICKET_UNASSIGNED
TICKET_CLOSED

TICKET_CATEGORY_CREATED
TICKET_CATEGORY_UPDATED
TICKET_CATEGORY_DEACTIVATED
```

Audit records can contain:

```text
actorUserId
targetUserId
action
metadata
createdAt
```

The actor is taken from the authenticated session for administrative operations rather than from client-provided actor IDs.

---

# Authentication

NestStarter supports:

```text
Email + Password
OTP
Google OAuth
```

Authentication uses server-side sessions.

---

# Password Authentication

Password authentication uses bcrypt for password hashing.

Repeated failed password attempts are protected through Redis-backed login protection.

The authentication flow includes:

```text
Credentials
    │
    ▼
Login protection
    │
    ▼
Password verification
    │
    ▼
Session creation
```

Passwords are never stored in plaintext.

---

# OTP Authentication

OTP functionality supports authentication flows such as:

```text
Signup
Passwordless login
Email verification
```

OTP security includes:

- Cryptographically generated codes
- Hashing before storage
- Expiration
- Attempt limits
- Resend cooldowns
- Single-use verification
- Rate limiting

OTP state is stored in Redis rather than PostgreSQL.

The application uses an OTP abstraction so OTP delivery/storage details remain outside the domain.

---

# Google OAuth

Google OAuth is implemented using Passport.

The application supports Google authentication and account linking through the application layer.

Google account identifiers are kept separate from password authentication.

The domain prevents a different Google account from silently replacing an already-linked Google account.

---

# Sessions

NestStarter uses cookie-based server-side sessions.

```text
Browser
   │
   │ HTTP-only session cookie
   ▼
NestJS
   │
   ▼
Redis
   │
   └── session state
```

The browser stores only the session identifier.

Session state is stored server-side in Redis.

This allows multiple application instances to share session state when they use the same Redis infrastructure.

---

# Authorization

Authorization is based on the authenticated user's domain role.

Current roles:

```text
USER
ADMIN
```

Authenticated routes use session authentication.

Administrative routes additionally use:

```text
AdminAuthGuard
```

The general flow is:

```text
Request
   │
   ▼
Session authentication
   │
   ▼
Authenticated user
   │
   ▼
Admin authorization
   │
   ▼
ADMIN?
```

The authenticated session is also used as the actor identity for administrative mutations and audit records.

---

# User Management

User functionality includes:

```text
Create user
Get current user
Update current user
Change password
Search users
Update avatar
Delete avatar
```

Administrative functionality additionally includes:

```text
Create users
Get users
List users
Update users
Delete users

Change roles
Change status
Change/reset passwords

Manage avatars
Update balances

View audit logs
View financial ledgers
View statistics
```

Sensitive fields such as password hashes are not exposed through API response DTOs.

---

# Admin User Management

Administrative user mutations use the authenticated administrator as the actor.

For mutations, the general pattern is:

```text
Admin Controller
      │
      ▼
extract actorUserId from session
      │
      ▼
Admin Use Case
      │
      ▼
UnitOfWork
      │
      ▼
load / lock entity
      │
      ▼
domain operation
      │
      ▼
persist
      │
      ▼
AuditLog
      │
      ▼
commit
```

This keeps authorization, transaction boundaries, domain rules, persistence, and auditing separated.

---

# File Storage

File storage is represented by an application abstraction:

```text
FileStorage
```

The application does not depend directly on MinIO.

The abstraction supports operations such as:

```text
upload()
delete()
get()
getUrl()
healthCheck()
```

The current infrastructure implementation is:

```text
MinioService
```

This allows the object-storage implementation to be replaced without changing application business logic.

---

# MinIO

MinIO provides S3-compatible object storage.

Binary files are stored outside PostgreSQL.

For example:

```text
avatars/<user-id>/avatar.webp
```

The database stores the file reference while the binary object remains in object storage.

Files can be streamed through the application rather than loading the complete object into memory.

---

# Image Processing

Image processing is represented by:

```text
ImageProcessing
```

The current implementation uses:

```text
Sharp
```

The responsibilities are deliberately separated:

```text
ImageProcessing
       │
       ▼
Processed image
       │
       ▼
FileStorage
       │
       ▼
MinIO
```

This keeps image transformation independent from object storage.

---

# Avatar Management

Avatars are handled separately from ordinary profile updates.

User operations include:

```text
UpdateUserAvatar
DeleteUserAvatar
```

Administrative avatar operations are also supported.

The avatar workflow can handle:

- Image validation
- Image processing
- Object storage
- Existing-avatar replacement
- Avatar deletion
- Avatar references

---

# Redis

Redis is used for short-lived and distributed application state.

Current uses include:

- Server-side sessions
- OTP storage
- OTP expiration
- OTP attempt tracking
- OTP resend cooldowns
- Login protection
- Failed-login tracking

Redis is also used by the session store so application instances can share authentication state.

---

# Database

PostgreSQL is accessed through TypeORM.

The infrastructure database layer contains:

```text
ORM entities
Repository implementations
Migrations
Database configuration
Transaction management
```

Domain entities and ORM entities remain separate.

For example:

```text
Domain User
     ▲
     │ mapping
     ▼
UserOrmEntity
     │
     ▼
PostgreSQL
```

Current ORM entities include:

```text
UserOrmEntity
UserBalanceOrmEntity
LedgerOrmEntity
AuditLogOrmEntity

DepositOrmEntity
WithdrawalOrmEntity

TicketOrmEntity
TicketMessageOrmEntity
TicketCategoryOrmEntity
```

---

# Database Identity

Domain entities generate UUIDs when an ID is not supplied.

The ORM entities use application-assigned UUID primary columns:

```ts
@PrimaryColumn("uuid")
id!: string;
```

This keeps identity generation consistent between the domain and persistence layers.

---

# Financial Database Constraints

Financial records use PostgreSQL decimal/numeric columns with high precision.

For example:

```text
numeric(30,18)
```

is used for financial amounts and balances.

User balances also enforce uniqueness for:

```text
(userId, currency)
```

Deposits and withdrawals have unique application reference IDs.

Deposit provider payment IDs are also uniquely constrained.

These database constraints provide a second layer of protection in addition to application/domain rules.

---

# Database Migrations

The project uses TypeORM migrations for database schema changes.

Migrations are stored under:

```text
src/infrastructure/database/migrations/
```

Migration commands are provided through the project's npm scripts.

Generate a migration:

```bash
npm run migration:generate -- src/infrastructure/database/migrations/YourMigrationName
```

Run migrations:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

Production migrations:

```bash
npm run build
npm run migration:run:prod
```

Production deployments should use explicit migrations rather than relying on schema synchronization.

---

# Development Schema Synchronization

The NestJS TypeORM configuration currently enables:

```text
synchronize: process.env.NODE_ENV === "development"
```

This means application-level schema synchronization is available during development.

Production deployments should disable schema synchronization and use migrations.

The TypeORM CLI has a separate `DataSource` configuration, so migration behavior should always be verified against the environment being deployed.

---

# API Layer

The API layer is responsible for HTTP concerns.

```text
api/

├── admin/
├── auth/
├── files/
├── health/
└── users/
```

Controllers should remain thin.

Their primary responsibilities are:

1. Receive HTTP input
2. Validate/transform DTOs
3. Extract authenticated actor information where required
4. Call the appropriate use case
5. Return the result

Business rules belong in the domain/application layers.

---

# DTOs

API request and response contracts are represented through DTOs.

DTOs are responsible for:

- HTTP input validation
- Transformation
- Serialization
- Swagger documentation

DTOs are not domain entities.

This keeps HTTP-specific concerns at the API boundary.

---

# Validation

Global request validation uses:

```text
class-validator
class-transformer
NestJS ValidationPipe
```

The application validates HTTP input before it reaches business workflows.

The validation configuration is centralized rather than repeatedly implemented inside controllers.

---

# Error Handling

Domain exceptions do not know about HTTP.

For example:

```ts
throw new UserNotFoundException();
```

or:

```ts
throw new InsufficientBalanceException();
```

The API layer translates domain/application failures into HTTP responses.

The application also uses centralized exception handling and request IDs for tracing.

A typical error response can contain:

```json
{
  "statusCode": 404,
  "message": "User not found.",
  "error": "UserNotFoundException",
  "requestId": "..."
}
```

---

# Swagger / OpenAPI

Swagger/OpenAPI documentation is available during development.

```text
http://localhost:3000/api/docs
```

Controllers use NestJS Swagger decorators to document endpoints, parameters, request bodies, and responses.

The documentation covers the API surface including:

- Authentication
- User management
- Administrative operations
- Financial operations
- Tickets
- Ticket categories
- File endpoints
- Pagination and filtering

---

# Security

NestStarter includes security foundations such as:

- HTTP-only session cookies
- Server-side Redis sessions
- Bcrypt password hashing
- OTP hashing
- OTP expiration
- OTP attempt limits
- OTP resend cooldowns
- Redis-backed login protection
- Global throttling
- Helmet
- Credential-aware CORS
- Global request validation
- Role-based authorization
- Sensitive response filtering
- Environment validation
- UUID route validation
- Database row locking for concurrent financial mutations

Security configuration remains deployment-specific and should be reviewed before production use.

---

# Health Checks

The application exposes:

```text
GET /health
```

The health module provides a centralized health-check endpoint for application infrastructure.

It can be used by:

- Docker
- Container orchestrators
- Monitoring systems
- Deployment infrastructure

---

# Configuration

Configuration is environment-based and validated during startup.

Important configuration areas include:

```text
PostgreSQL
Redis
Sessions
SMTP
MinIO
Application URL
CORS
Authentication
```

Example environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nest_clean_arch

REDIS_HOST=localhost
REDIS_PORT=6379

SESSION_SECRET=your-long-random-secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=app
```

Refer to:

```text
.env.example
.env.production.example
```

for the repository's supported configuration.

Secrets should never be committed to Git.

---

# Docker

Development infrastructure can be started with Docker Compose:

```bash
docker compose up --build
```

The project also contains a production-oriented Compose configuration:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up --build -d
```

Stop the development stack:

```bash
docker compose down
```

Remove containers and persisted Docker volumes:

```bash
docker compose down -v
```

The production Compose setup is designed to keep internal infrastructure services such as PostgreSQL and Redis from being unnecessarily exposed to the host.

---

# Testing

Jest is used for automated testing.

Tests cover important application and infrastructure behavior, including areas such as:

- Authentication
- OTP
- Password hashing
- Login protection
- Sessions
- Guards
- User management
- Administrative operations
- Balance workflows
- Financial workflows
- Ticket workflows
- Repository behavior

Run tests:

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

Run sequentially:

```bash
npm test -- --runInBand
```

Build the application:

```bash
npm run build
```

---

# Adding a New Feature

A typical feature follows this structure:

```text
1. Domain
   └── Entity / Enum / Exception / Repository contract

2. Application
   └── Use Case / Input / Interface

3. Infrastructure
   └── Repository / External-service implementation

4. API
   └── DTO / Controller / Guard / Module

5. Tests
   └── Unit / Integration / E2E
```

For a mutation involving multiple related database operations:

```text
Controller
    │
    ▼
Use Case
    │
    ▼
UnitOfWork
    │
    ├── Load / lock entities
    ├── Domain operation
    ├── Persist changes
    └── Create audit record
```

The authenticated actor should come from the session rather than from client-provided actor IDs.

---

# Recommended Mutation Pattern

NestStarter follows a consistent pattern for important mutations:

```text
Controller
    │
    ▼
Extract actorUserId from session
    │
    ▼
UseCase(input)
    │
    ▼
UnitOfWork
    │
    ▼
Load / lock mutable records
    │
    ▼
Domain operation
    │
    ▼
Persist
    │
    ▼
AuditLog
    │
    ▼
Commit
```

This pattern is especially important for:

- Administrative mutations
- Financial mutations
- Ticket mutations
- User management operations

Reads that do not require a transaction can use repository operations directly.

---

# Current Major Features

NestStarter currently provides foundations for:

```text
Architecture
├── Clean Architecture
├── Domain entities
├── Repository contracts
├── Application use cases
└── Infrastructure implementations

Authentication
├── Password login
├── OTP authentication
├── Google OAuth
├── Sessions
└── Redis-backed login protection

Users
├── User registration
├── Profiles
├── Password management
├── Search
├── Avatars
└── Administrative management

Financials
├── User balances
├── Immutable ledger
├── Deposits
├── Withdrawal requests
├── Withdrawal approval
├── Withdrawal rejection/refund
└── Payment provider abstraction

Support
├── Tickets
├── Ticket messages
├── Ticket categories
├── Assignment
├── Priority
├── Status transitions
└── Administrative ticket management

Infrastructure
├── PostgreSQL
├── TypeORM
├── Redis
├── MinIO
├── Sharp
├── SMTP
├── Docker
└── Health checks

Security
├── Session authentication
├── Role-based authorization
├── OTP protection
├── Login protection
├── Rate limiting
├── Helmet
├── CORS
├── Validation
└── Centralized error handling

Observability / administration
├── Audit logs
├── Financial history
├── Administrative statistics
└── Request IDs
```

---

# Technology Stack

| Area                 | Technology                                |
| -------------------- | ----------------------------------------- |
| Runtime              | Node.js                                   |
| Framework            | NestJS                                    |
| Language             | TypeScript                                |
| Architecture         | Clean Architecture                        |
| Database             | PostgreSQL                                |
| ORM                  | TypeORM                                   |
| Transactions         | TypeORM + Unit of Work                    |
| Cache / State        | Redis                                     |
| Sessions             | express-session + connect-redis           |
| Authentication       | Password, OTP, Google OAuth               |
| OAuth                | Passport + Google OAuth 2.0               |
| Password hashing     | bcrypt                                    |
| Email                | Nodemailer / SMTP                         |
| Object storage       | MinIO                                     |
| Image processing     | Sharp                                     |
| Validation           | class-validator / class-transformer / Joi |
| Security headers     | Helmet                                    |
| Rate limiting        | NestJS Throttler                          |
| API documentation    | Swagger / OpenAPI                         |
| Financial arithmetic | BigInt-based decimal utilities            |
| Testing              | Jest / ts-jest                            |
| Containers           | Docker / Docker Compose                   |

---

# Getting Started

## Requirements

- Node.js 20+
- npm
- Docker Desktop

PostgreSQL and Redis can also be installed separately for local development.

SMTP credentials are required for actual email/OTP delivery.

MinIO is required for the included object-storage functionality unless another `FileStorage` implementation is provided.

---

# Installation

Clone the repository:

```bash
git clone https://github.com/rezkhaleghi/NestStarter.git
cd NestStarter
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the environment variables.

---

# Start with Docker

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api/docs
```

Stop the stack:

```bash
docker compose down
```

Remove containers and persisted volumes:

```bash
docker compose down -v
```

---

# Start Locally

Start PostgreSQL, Redis, MinIO, and any other required infrastructure.

Then:

```bash
npm run start:dev
```

When using migrations explicitly:

```bash
npm run migration:run
```

---

# Common Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Tests
npm test

# Tests with coverage
npm test -- --coverage

# Tests sequentially
npm test -- --runInBand

# Generate migration
npm run migration:generate

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Run production migrations
npm run migration:run:prod
```

---

# Production Considerations

NestStarter provides a strong foundation, but production deployment remains application-specific.

Before deployment:

- Generate a strong unique `SESSION_SECRET`
- Use HTTPS
- Configure secure production cookies
- Keep secrets outside version control
- Use production SMTP credentials
- Disable sensitive development logging
- Use explicit database migrations
- Disable database schema synchronization in production
- Secure Redis with authentication/network controls
- Secure MinIO/object storage
- Review CORS configuration
- Review rate-limit configuration for the deployment topology
- Review dependency versions
- Configure application logging and monitoring
- Run integration/E2E tests against real infrastructure
- Review transaction boundaries
- Review concurrent financial operations
- Review provider idempotency and reconciliation
- Validate uploaded files and image-processing limits
- Configure object-storage access policies
- Monitor storage usage and orphaned files
- Review publicly accessible file URLs
- Review session lifecycle and cookie configuration

For real payment providers, additionally implement provider-specific:

- Webhooks
- Idempotency
- Reconciliation
- Failure handling
- Timeout handling
- Duplicate-event handling
- Provider withdrawal status synchronization

---

# What NestStarter Is

NestStarter is:

- A reusable NestJS backend foundation
- A Clean Architecture reference implementation
- An authentication and authorization foundation
- A user-management foundation
- A transactional application foundation
- A financial balance and ledger foundation
- A deposit/withdrawal foundation
- A customer-support ticket foundation
- An object-storage and image-processing foundation
- An administrative auditing foundation
- A PostgreSQL/Redis/Docker development foundation

---

# What NestStarter Is Not

NestStarter is not:

- A framework
- A complete SaaS application
- A domain-specific business solution
- A complete payment processor
- A complete accounting system
- A complete customer-support product
- A replacement for an application-specific security review
- A guarantee that every deployment is production-ready without configuration

The intention is to provide a strong starting point while leaving the actual business domain to the application that uses it.

---

# Project Principles

### Business logic first

The domain and application layers define application behavior.

### Infrastructure is replaceable

PostgreSQL, Redis, SMTP, MinIO, Sharp, bcrypt, TypeORM, and provider SDKs are implementation details.

### Controllers stay thin

Controllers coordinate HTTP and application operations.

### Use cases stay focused

A use case represents one meaningful application operation.

### Domain stays framework-independent

The domain should not require NestJS, TypeORM, Express, Redis, MinIO, or other infrastructure libraries.

### Explicit dependencies

Dependencies should be visible through constructors and interfaces.

### Separate external capabilities

External capabilities such as:

```text
FileStorage
ImageProcessing
PasswordHasher
OtpService
NotificationService
LoginProtection
PaymentProvider
UnitOfWork
```

are represented through abstractions.

### Transactions belong at the workflow boundary

When multiple database changes must succeed or fail together, the application defines the workflow through `UnitOfWork`.

### Lock mutable financial state

Concurrent financial mutations should lock the relevant database records before modifying them.

### Audit important operations

Important administrative and financial operations should produce traceable audit records.

### Current state and historical state are separate

Current values such as `UserBalance.amount` represent current state.

Immutable `Ledger` records represent financial history.

### Financial arithmetic must preserve precision

Money and payment amounts should not rely on JavaScript floating-point arithmetic.

### Database constraints provide defense in depth

Important uniqueness and integrity rules should be reinforced at the database level where appropriate.

---

# License

MIT

---

# Built with ❤️ by PocketJack

**Reza Khaleghi** — Software Engineer

- GitHub: https://github.com/rezkhaleghi
- LinkedIn: https://linkedin.com/in/rezaxkhaleghi
- Email: `rezaxkhaleghi@gmail.com`

---

**NestStarter** — built to save time, reduce boilerplate, and keep your architecture clean.
