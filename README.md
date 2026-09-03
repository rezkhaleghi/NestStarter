# NestStarter

A production-oriented **NestJS backend boilerplate built around Clean Architecture**.

NestStarter provides the infrastructure and application foundations that most backend projects repeatedly need: authentication, authorization, user management, sessions, Redis, PostgreSQL, object storage, image processing, email/OTP, validation, rate limiting, health checks, auditing, transactional workflows, Swagger/OpenAPI, Docker, migrations, and testing.

The goal is simple:

> **Start with a solid backend foundation, keep business logic independent from frameworks and infrastructure, and spend your time building the actual product.**

---

# Why NestStarter?

Most NestJS projects start with a collection of modules, controllers, services, and database entities. That works initially, but as the application grows, business logic tends to become coupled to NestJS, TypeORM, Redis, HTTP, and other infrastructure concerns.

NestStarter takes a different approach.

The application is organized around **business rules and use cases**, while frameworks and external services are treated as replaceable implementation details.

This gives the project:

- Clear separation of responsibilities
- Testable business logic
- Explicit dependencies
- Replaceable infrastructure
- Framework-independent domain logic
- Focused use cases instead of large generic services
- A predictable structure for adding new features
- Production-oriented authentication and security foundations
- Dedicated abstractions for external services
- Dedicated file-storage and image-processing capabilities
- Transactional workflows through Unit of Work
- Centralized error handling
- Global request validation
- Administrative auditing

NestStarter is intentionally **not a complete application**. It provides the foundation on which an application can be built.

---

# Core Goals

## 1. Clean Architecture

Business rules should not depend on PostgreSQL, Redis, MinIO, Express, or NestJS.

The dependency direction is:

```text
API
 │
 ▼
Application
 │
 ▼
Domain

Infrastructure ───────► Application / Domain
```

The important rule is that dependencies point **toward the domain**.

For example:

```text
Controller
   │
   ▼
Use Case
   │
   ▼
UserRepository
   ▲
   │
TypeORM Repository
```

The use case knows about `UserRepository`.

It does not know that the repository happens to use TypeORM or PostgreSQL.

This makes infrastructure replaceable without rewriting business logic.

---

# Architecture

```text
src/
│
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
│       ├── admin-users/
│       ├── auth/
│       └── users/
│
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── exceptions/
│   └── repositories/
│
├── infrastructure/
│   ├── auth/
│   ├── config/
│   ├── database/
│   └── services/
│
├── shared/
│   └── pagination/
│
└── types/
```

---

# Domain Layer

The domain contains business concepts and rules.

```text
domain/

├── entities/
├── enums/
├── exceptions/
└── repositories/
```

## Entities

Domain entities represent business objects without depending on TypeORM or NestJS.

Current domain entities include:

```text
User
UserBalance
AuditLog
```

### User

The `User` domain entity contains user-related business state such as:

```text
id
firstName
lastName
userName
email
hashedPassword
dateOfBirth
avatar
bio
role
status
emailVerified
googleId
createdAt
updatedAt
```

The domain entity remains independent from the database ORM.

### UserBalance

`UserBalance` represents the current balance of a user for a specific payment currency.

```text
UserBalance
├── id
├── userId
├── currency
└── amount
```

The entity is created through a domain factory:

```ts
UserBalance.create({
  userId,
  currency,
  amount,
});
```

This keeps construction explicit and avoids exposing the entity's internal constructor.

### AuditLog

`AuditLog` represents an immutable record of an important application or administrative action.

```text
AuditLog
├── id
├── actorUserId
├── targetUserId
├── action
└── metadata
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

Domain entities therefore own their construction and business state while persistence remains outside the domain.

---

# Domain Entity Factories

Entities that require controlled construction use factory methods instead of exposing positional constructors.

For example:

```ts
const user = User.create({
  id,
  email,
  hashedPassword,
  role,
  emailVerified,
});
```

and:

```ts
const balance = UserBalance.create({
  userId,
  currency,
  amount,
});
```

This provides several advantages:

- Named properties instead of positional arguments
- Easier-to-read construction
- Safer evolution of entities
- Encapsulation of internal constructors
- A clear place for future creation rules

The domain remains responsible for its own object creation while the application layer remains responsible for orchestration.

---

## Enums

Current domain enumerations include:

```text
UserRole
UserStatus
AuditAction
PaymentCurrency
```

For example:

```text
UserRole

USER
ADMIN
```

User lifecycle/state is represented separately through `UserStatus`.

---

## Exceptions

Business errors live in the domain instead of the HTTP layer.

Current domain exceptions include:

```text
InvalidOtpException
OtpCooldownException
UserAlreadyExistsException
UsernameAlreadyExistsException
InvalidCredentialsException
GoogleAccountConflictException
UserNotFoundException
UserBalanceAlreadyExistsException
CannotRemoveLastAdminException
CannotDeleteSelfException
```

All domain exceptions inherit from:

```text
DomainException
```

For example:

```ts
throw new UserNotFoundException();
```

The domain does not know anything about HTTP status codes, Express, or NestJS exception classes.

The API layer is responsible for translating domain exceptions into HTTP responses.

---

## Repository Contracts

Repositories are defined as contracts in the domain.

Current repository contracts include:

```text
UserRepository
UserBalanceRepository
AuditLogRepository
```

The domain defines the persistence operations required by the application.

The infrastructure layer provides the actual implementations.

This keeps persistence technology out of the domain.

---

# Application Layer

The application layer contains **use cases**.

A use case represents an action the system can perform.

Current user-related use cases include:

```text
CreateUser
GetCurrentUser
UpdateCurrentUser
ChangeUserPassword
SearchUsers
UpdateUserAvatar
DeleteUserAvatar
```

User balance operations include:

```text
CreateUserBalance
```

Authentication use cases include:

```text
LoginWithPassword
LoginWithOtp
VerifyOtp
GoogleAuth
```

Administrative use cases include:

```text
CreateUser
DeleteUser
GetUser
ListUsers
UpdateUser
CreateUserBalance
GetAuditLogs
ListAuditLogs
GetStatistics
DeleteUserAvatar
```

The same business operation can therefore have different application entry points depending on its context.

The application layer contains the business workflow rather than HTTP-specific logic.

---

# Use-Case-Oriented Design

Instead of creating a large generic:

```text
UserService
```

with dozens of unrelated responsibilities, important operations are represented by focused use cases.

For example:

```text
UpdateCurrentUserUseCase
UpdateUserAvatarUseCase
DeleteUserAvatarUseCase
ChangeUserPasswordUseCase
SearchUsersUseCase
CreateUserBalanceUseCase
```

This makes each operation:

- Easier to understand
- Easier to test
- Easier to authorize
- Easier to audit
- Easier to replace or extend

---

# Unit of Work

NestStarter provides a `UnitOfWork` abstraction for application workflows that require multiple related database operations to succeed or fail together.

The application depends on:

```text
UnitOfWork
```

rather than directly depending on TypeORM transactions.

The Unit of Work exposes transaction-scoped repository implementations:

```text
UnitOfWork
    │
    ▼
┌───────────────────────────────┐
│ Transaction-scoped repositories│
├───────────────────────────────┤
│ UserRepository                │
│ UserBalanceRepository         │
│ AuditLogRepository            │
└───────────────────────────────┘
```

For example:

```ts
return this.unitOfWork.execute(
  async ({ userRepository, userBalanceRepository, auditLogRepository }) => {
    // transactional workflow
  },
);
```

The infrastructure layer provides the concrete implementation:

```text
UnitOfWork
    ▲
    │
TypeOrmUnitOfWork
    │
    ▼
TypeORM EntityManager
```

`TypeOrmUnitOfWork` creates transaction-scoped repositories using the TypeORM `EntityManager`.

This keeps transaction management and TypeORM-specific behavior inside infrastructure.

---

# Transactional Workflows

Operations involving multiple related writes can use a single database transaction.

For example, creating a user can involve:

```text
Create User
     │
     ├── Create UserBalance
     │
     └── Create AuditLog
```

The complete workflow runs inside one transaction:

```text
BEGIN
  │
  ├── Check user
  ├── Create user
  ├── Create initial balance
  └── Create audit log
  │
COMMIT
```

If any transactional database operation fails:

```text
ROLLBACK
```

This prevents partially completed workflows.

The Unit of Work therefore provides a clear boundary for operations that require database atomicity.

---

# Application Interfaces

External capabilities are represented through application-level abstractions.

Current interfaces include:

```text
AdminStatistics
AuditLogger
FileStorage
ImageProcessing
LoginProtection
NotificationService
OtpService
PasswordHasher
UnitOfWork
```

The application depends on these abstractions.

Infrastructure provides their implementations.

For example:

```text
Application
    │
    ▼
PasswordHasher
    ▲
    │
BcryptPasswordHasherService
```

Another example:

```text
Application
    │
    ▼
FileStorage
    ▲
    │
MinioService
```

And for transactional workflows:

```text
Application
    │
    ▼
UnitOfWork
    ▲
    │
TypeOrmUnitOfWork
```

This allows infrastructure technologies to be replaced without changing application use cases.

---

# Infrastructure Layer

Infrastructure contains implementations of external concerns.

```text
infrastructure/

├── auth/
├── config/
├── database/
└── services/
```

Infrastructure is where NestJS, TypeORM, PostgreSQL, Redis, MinIO, SMTP, bcrypt, Sharp, and other external technologies are integrated.

---

# Database

PostgreSQL is accessed through TypeORM.

The infrastructure layer contains:

- ORM entities
- Repository implementations
- Database configuration
- TypeORM migrations
- Database seed/bootstrap logic
- Transaction management

The ORM entities are intentionally separate from domain entities.

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

This prevents TypeORM decorators and persistence concerns from leaking into the domain.

Current database ORM entities include:

```text
UserOrmEntity
UserBalanceOrmEntity
AuditLogOrmEntity
```

---

# Database Migrations

The project uses TypeORM migrations for schema changes.

Current migrations include:

```text
InitialUsers
CreateAuditLogs
AddUserProfileFields
AddUserStatus
```

Production deployments should use migrations rather than relying on TypeORM schema synchronization.

Available commands:

```bash
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run migration:run:prod
```

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

The application interacts with Redis through abstractions where appropriate rather than coupling business logic directly to the Redis client.

---

# Sessions

NestStarter uses **cookie-based server-side sessions**.

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
   └── session data / userId
```

The browser receives the session identifier through an HTTP-only cookie.

Session state is stored server-side.

This allows multiple application instances to share session state when they use the same Redis infrastructure.

---

# Authentication

NestStarter supports multiple authentication flows.

## Email + Password

Password authentication is handled through an application use case.

Passwords are hashed using bcrypt.

Repeated failed password attempts are protected through Redis-backed login protection.

---

## OTP Authentication

OTP authentication is supported for authentication flows such as:

- Signup
- Passwordless login

OTP security includes:

- Hashing before storage
- Expiration
- Maximum verification attempts
- Resend cooldown
- Single-use verification
- Rate limiting

OTP data is stored in Redis rather than PostgreSQL.

The application uses an `OtpService` abstraction so OTP implementation details remain outside the domain.

---

## Google OAuth

Google OAuth is implemented using Passport.

The application supports:

- Google login
- Google signup
- Linking Google accounts
- Existing local accounts
- Provider ID uniqueness

Authentication decisions remain in application use cases rather than being embedded inside the Passport strategy.

---

# Authorization

Authorization is based on the user's domain role.

Currently:

```text
USER
ADMIN
```

Authenticated routes use the session authentication guard.

Administrative routes additionally use the admin authorization guard.

```text
Request
   │
   ▼
Session Guard
   │
   ▼
Authenticated User
   │
   ▼
Admin Guard
   │
   ▼
ADMIN role?
```

The domain user remains the source of truth for authorization.

---

# User Management

The boilerplate provides a complete foundation for user management.

Supported operations include:

- Create user
- Get current user
- Update current user
- Change password
- Search users
- Update avatar
- Delete avatar

Profile data is deliberately separated from avatar storage.

A normal profile update can modify fields such as:

```text
firstName
lastName
userName
dateOfBirth
bio
```

Avatar operations use dedicated use cases because they involve external object storage and image processing.

---

# User Balance

NestStarter provides a domain-level `UserBalance` model for representing a user's current balance in a specific currency.

```text
User
 │
 └── UserBalance
       ├── currency
       └── amount
```

Balance creation is handled through a dedicated use case:

```text
CreateUserBalanceUseCase
```

The operation validates:

- The target user exists
- A balance for the requested currency does not already exist

The balance is then created through the domain factory:

```ts
UserBalance.create({
  userId,
  currency,
  amount,
});
```

When the operation is part of a workflow involving related database changes, it is executed through `UnitOfWork`.

> `UserBalance` represents the **current state** of a balance. A future accounting/ledger layer can provide immutable financial history when required by a specific application.

---

# User Search

Users can be searched through the user API.

Search functionality is represented through a dedicated application use case and request/response DTOs.

The search layer is separated from the general user retrieval flow so that search-specific filtering and pagination can evolve independently.

---

# File Storage

NestStarter provides an abstraction for object/file storage:

```text
FileStorage
```

The application layer does not depend directly on MinIO.

The abstraction provides:

```ts
upload(
  objectName: string,
  buffer: Buffer,
  contentType: string,
): Promise<void>;

delete(objectName: string): Promise<void>;

get(objectName: string): Promise<{
  stream: Readable;
  contentType: string;
  size: number;
}>;

getUrl(objectName: string): string;

healthCheck(): Promise<void>;
```

The current infrastructure implementation is:

```text
MinioService
```

This means MinIO can be replaced with another object-storage implementation without changing application use cases.

---

# MinIO

MinIO provides S3-compatible object storage.

Files are stored outside PostgreSQL.

For example, an avatar can be stored using an object path such as:

```text
avatars/<user-id>/avatar.webp
```

The application stores the avatar reference while the actual binary file remains in object storage.

The file API streams stored objects rather than loading the entire file into the HTTP response layer.

```text
Client
  │
  ▼
FilesController
  │
  ▼
FileStorage
  │
  ▼
MinioService
  │
  ▼
MinIO
```

---

# File API

Files are exposed through:

```text
GET /files/*
```

For example:

```text
GET /files/avatars/<user-id>/avatar.webp
```

The Files API:

- Resolves the object path
- Retrieves the object from storage
- Preserves the stored content type
- Preserves the object size
- Streams the object to the client

The file endpoint is documented through Swagger/OpenAPI.

---

# Image Processing

Image processing is represented by an application-level abstraction:

```text
ImageProcessing
```

The infrastructure implementation uses:

```text
Sharp
```

Image processing is kept separate from file storage.

This gives the architecture a clear distinction between:

```text
Image transformation
```

and:

```text
Object storage
```

For example:

```text
Avatar Upload
     │
     ▼
Image Processing
     │
     ▼
Processed Image
     │
     ▼
File Storage
     │
     ▼
MinIO
```

---

# Avatar Management

Avatars are treated as a separate concern from ordinary profile updates.

User avatar operations include:

```text
UpdateUserAvatar
DeleteUserAvatar
```

Administrative avatar operations are also supported.

This prevents object-storage concerns from leaking into normal profile-management logic.

The avatar flow can therefore independently handle:

- Image validation
- Image processing
- Object storage
- Existing-avatar replacement
- Avatar deletion
- Avatar references

---

# Admin Management

Administrators can manage users through dedicated application use cases.

Supported operations include:

- Create users
- Update users
- Delete users
- Get individual users
- List users
- Create user balances
- Change/reset passwords
- Manage roles
- Manage user profiles
- Manage user status
- Manage avatars
- View audit logs
- List audit logs
- View user statistics

Administrative operations are protected by the admin authorization guard.

Sensitive fields such as password hashes are never exposed through API response DTOs.

---

# Audit Logging

Administrative actions are audit logged.

Audit logging is implemented through an application-level abstraction:

```text
AuditLogger
```

with an infrastructure implementation responsible for persistence.

Transactional workflows that require the audit record to be committed atomically with other database changes can use the transaction-scoped:

```text
AuditLogRepository
```

provided by `UnitOfWork`.

The audit system records information such as:

```text
Who performed the action?

What action was performed?

Which user/resource was affected?

When did it happen?
```

Audit logs have their own domain entity, repository contract, ORM entity, and application use cases.

Available audit operations include:

```text
GetAuditLogs
ListAuditLogs
```

This keeps audit functionality separate from the HTTP controllers and database implementation.

---

# Admin Statistics

Administrative statistics are exposed through an application abstraction:

```text
AdminStatistics
```

The infrastructure implementation provides the actual statistics.

This allows statistics to be calculated without coupling the administrative application layer directly to TypeORM queries.

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

Their job is primarily to:

1. Receive the HTTP request
2. Validate/transform input
3. Call the appropriate use case or application abstraction
4. Return the result

Business rules belong in the application/domain layers.

---

# DTOs

API request and response contracts are represented through dedicated DTOs.

Examples include:

```text
AuthRequestDto
AuthenticatedUserResponseDto
ChangePasswordRequestDto
UpdateProfileRequestDto
SearchUsersRequestDto
UserSearchResponseDto
AdminUserRequestDto
AdminUserResponseDto
AdminUserListResponseDto
AuditLogRequestDto
AuditLogResponseDto
GetAuditLogsQueryDto
ChangeUserPasswordRequestDto
```

DTOs belong to the API layer and should not be used as domain entities.

This keeps HTTP-specific validation and serialization concerns at the API boundary.

---

# Swagger / OpenAPI

Swagger/OpenAPI documentation is available during development.

```text
http://localhost:3000/api/docs
```

Controllers are documented using NestJS Swagger decorators.

The API documentation includes:

- Endpoint descriptions
- Operation summaries
- Request parameters
- Request bodies
- Response types
- HTTP response codes
- Authentication-related responses
- Multipart file-upload documentation
- File endpoint documentation

The goal is for **all API controllers and endpoints to be explicitly documented**, rather than relying only on generated route information.

---

# Validation

Global request validation is enabled using:

- `class-validator`
- `class-transformer`
- NestJS `ValidationPipe`

DTOs define the API contract.

Validation therefore happens at the API boundary before data reaches application logic.

This keeps invalid HTTP input away from application and domain logic.

Global validation is configured centrally rather than repeatedly implemented inside individual controllers.

---

# Error Handling

Domain exceptions do not know about HTTP.

For example:

```ts
throw new UserNotFoundException();
```

The API layer translates the exception into an appropriate HTTP response.

Example:

```json
{
  "statusCode": 404,
  "message": "User not found.",
  "error": "UserNotFoundException",
  "requestId": "..."
}
```

HTTP exceptions are also handled consistently.

The API includes centralized exception handling so controllers and use cases do not need repetitive HTTP error formatting.

A request ID is included in error responses for tracing.

---

# Security

NestStarter includes several security foundations:

- HTTP-only session cookies
- Server-side Redis sessions
- Bcrypt password hashing
- OTP hashing
- OTP expiration
- OTP attempt limits
- OTP resend cooldown
- Redis-backed login protection
- Global throttling
- Helmet
- Credential-aware CORS
- Global request validation
- Role-based authorization
- Sensitive response filtering
- Environment validation

Security-sensitive configuration is provided through environment variables.

Secrets should never be committed to the repository.

---

# Health Checks

The application exposes:

```text
GET /health
```

The health module provides a centralized health-check endpoint for the application and its required infrastructure.

This endpoint can be used by Docker, container orchestrators, monitoring systems, or deployment infrastructure to determine whether the application is healthy.

---

# Configuration

Configuration is environment-based.

Joi validates the application's environment variables during startup.

Example:

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

See:

```text
.env.example
.env.production.example
```

for the supported configuration.

---

# Docker

Development infrastructure can be started with Docker Compose.

```bash
docker compose up --build
```

A production-oriented Compose configuration is also included:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up --build -d
```

The production configuration is designed so PostgreSQL and Redis are not unnecessarily exposed to the host.

---

# Testing

Jest is used for unit testing.

Tests currently cover important parts of the application and infrastructure layers, including:

- Authentication use cases
- User use cases
- Administrative use cases
- Guards
- Session serialization
- Password hashing
- OTP services
- Login protection
- Redis-backed services
- User balance workflows

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

Run tests sequentially:

```bash
npm test -- --runInBand
```

Build the application:

```bash
npm run build
```

The application layer is designed to be highly unit-testable because use cases depend on abstractions rather than concrete infrastructure implementations.

---

# Adding a New Feature

A typical feature follows this flow:

```text
1. Domain

   └── Entity / Enum / Exception / Repository contract

2. Application

   └── Use case / Input model / Interface

3. Infrastructure

   └── Repository or external-service implementation

4. API

   └── DTO / Controller / Guard / Module

5. Tests

   └── Unit / Integration / E2E
```

For features involving multiple related database operations, define the transactional boundary at the application layer using `UnitOfWork`.

For example:

```text
Controller
    │
    ▼
UseCase
    │
    ▼
UnitOfWork
    │
    ├── Domain Entity
    │
    ├── Repository Interface
    │
    └── Application Interface
             ▲
             │
       Infrastructure
```

This structure keeps the feature understandable and prevents infrastructure details from spreading throughout the application.

---

# Current Project Structure

The current project is organized into the following major areas:

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
│       ├── admin-users/
│       ├── auth/
│       └── users/
│
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── exceptions/
│   └── repositories/
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

# Project Principles

NestStarter follows several principles.

### Business logic first

The domain and application layers define the behavior of the system.

### Infrastructure is replaceable

PostgreSQL, Redis, SMTP, MinIO, Sharp, bcrypt, and TypeORM are implementation details.

### Controllers stay thin

Controllers coordinate HTTP and application operations. They should not contain business rules.

### Use cases stay focused

One use case should represent one meaningful operation.

### Domain stays framework-independent

The domain should not require NestJS, TypeORM, Express, Redis, MinIO, or other infrastructure libraries.

### Explicit dependencies

Dependencies should be visible through constructors and interfaces rather than hidden global state.

### Separate external capabilities

File storage, image processing, password hashing, OTP, login protection, notifications, auditing, statistics, and transaction management are represented through abstractions.

### Transactions belong at the application workflow boundary

When multiple related database changes must succeed or fail together, the application defines the workflow through `UnitOfWork` while infrastructure handles the actual database transaction.

### Security by default

Authentication, authorization, password hashing, session storage, validation, rate limiting, and centralized error handling are provided as foundations rather than being left for every project to implement independently.

### Audit important administrative operations

Administrative actions should be traceable without coupling business logic directly to the persistence mechanism.

### Current state and historical state are separate concerns

Current values such as `UserBalance.amount` represent application state. When a domain requires financial accounting or immutable transaction history, a dedicated ledger/accounting model should be introduced rather than using the current balance itself as historical evidence.

---

# Technology Stack

| Area              | Technology                                |
| ----------------- | ----------------------------------------- |
| Runtime           | Node.js                                   |
| Framework         | NestJS                                    |
| Language          | TypeScript                                |
| Architecture      | Clean Architecture                        |
| Database          | PostgreSQL                                |
| ORM               | TypeORM                                   |
| Transactions      | TypeORM + Unit of Work                    |
| Cache / State     | Redis                                     |
| Sessions          | express-session + connect-redis           |
| Authentication    | Password, OTP, Google OAuth               |
| OAuth             | Passport + Google OAuth 2.0               |
| Password hashing  | bcrypt                                    |
| Email             | Nodemailer / SMTP                         |
| Object storage    | MinIO                                     |
| Image processing  | Sharp                                     |
| Validation        | class-validator / class-transformer / Joi |
| Security headers  | Helmet                                    |
| Rate limiting     | NestJS Throttler                          |
| API documentation | Swagger / OpenAPI                         |
| Testing           | Jest / ts-jest                            |
| Containers        | Docker / Docker Compose                   |

---

# Getting Started

## Requirements

- Node.js 20+
- npm
- Docker Desktop

For a local setup without Docker, PostgreSQL and Redis can also be installed separately.

For real OTP delivery, an SMTP account is required.

MinIO is required when using the file/avatar functionality unless another `FileStorage` implementation is provided.

---

## Installation

```bash
git clone https://github.com/rezkhaleghi/NestStarter.git

cd NestStarter

npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required values.

---

## Start with Docker

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

Remove containers and persisted Docker volumes:

```bash
docker compose down -v
```

---

## Start Locally

After PostgreSQL, Redis, and the required external infrastructure are running:

```bash
npm run migration:run

npm run start:dev
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

Before deploying a project built from NestStarter:

- Generate a strong unique `SESSION_SECRET`
- Use HTTPS
- Enable secure production cookies
- Keep secrets outside version control
- Use production SMTP credentials
- Keep OTP logging disabled
- Use database migrations
- Secure Redis with authentication/network controls
- Configure MinIO/object storage securely
- Review CORS configuration
- Review throttling configuration for your deployment topology
- Review dependency versions
- Configure application logging and monitoring
- Run integration/E2E tests against real infrastructure
- Review database transaction boundaries for concurrent operations
- Configure object-storage access policies appropriately
- Review uploaded-file validation and image-processing limits
- Ensure publicly accessible file URLs are intentional
- Monitor storage usage and orphaned files
- Review transaction boundaries for workflows involving multiple related writes
- Ensure financial applications use an appropriate immutable ledger/accounting model rather than relying solely on current balance values

NestStarter provides the foundation, but production configuration remains application and deployment specific.

---

# What NestStarter Is — and Isn't

NestStarter **is**:

- A reusable NestJS backend foundation
- A Clean Architecture reference implementation
- An authentication and user-management starting point
- A production-oriented infrastructure template
- A foundation for building APIs without repeatedly solving the same backend problems
- An example of use-case-oriented application design
- A foundation for object storage and image-processing workflows
- A foundation for administrative auditing
- A foundation for transactional application workflows

NestStarter **isn't**:

- A framework
- A complete SaaS application
- A domain-specific business solution
- A complete accounting or financial ledger system
- A replacement for application-specific security review
- A promise that every deployment is production-ready without configuration

The intention is to provide a strong starting point while leaving the actual business domain to the project that uses it.

---

# License

MIT

---

# Built with ❤️ by PocketJack

**Reza Khaleghi** — software engineer

- GitHub: github.com/rezkhaleghi
- LinkedIn: linkedin.com/in/rezaxkhaleghi
- Email: `rezaxkhaleghi@gmail.com`

---

**NestStarter** — built to save time, reduce boilerplate, and keep your architecture clean.

```

One important point: **I intentionally did not add `Ledger` as a current feature.** I only documented the architectural distinction between current balance and a future ledger. When/if we actually implement the ledger, we can update the README with the real entities, repositories, migrations, and transaction flow.
```
