# NestStarter

A production-oriented **NestJS backend boilerplate built around Clean Architecture**.

NestStarter provides the infrastructure and application foundations that most backend projects repeatedly need: authentication, authorization, user management, sessions, Redis, PostgreSQL, object storage, email/OTP, validation, rate limiting, health checks, auditing, Swagger, Docker, migrations, and testing.

The goal is simple:

> **Start with a solid backend foundation, keep business logic independent from frameworks and infrastructure, and spend your time building the actual product.**

[Repository](https://github.com/rezkhaleghi/NestStarter)

---

## Why NestStarter?

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
│   ├── auth/
│   ├── users/
│   ├── admin/
│   └── health/
│
├── application/
│   ├── dtos/
│   ├── interfaces/
│   └── use-cases/
│       ├── auth/
│       ├── users/
│       └── admin-users/
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
└── types/
```

## Domain

The domain contains business concepts and rules.

```text
domain/
├── entities/
├── enums/
├── exceptions/
└── repositories/
```

### Entities

Domain entities represent business objects without depending on TypeORM or NestJS.

For example:

```text
User
AuditLog
```

### Enums

Domain-specific enumerations such as:

```text
UserRole
UserStatus
AuditAction
```

### Exceptions

Business errors live in the domain instead of the HTTP layer.

Examples:

```text
UserNotFoundException
UserAlreadyExistsException
InvalidCredentialsException
InvalidOtpException
UsernameAlreadyExistsException
CannotDeleteSelfException
CannotRemoveLastAdminException
```

The API layer translates these domain exceptions into HTTP responses.

This keeps the domain independent from HTTP.

### Repository contracts

Repositories are defined as interfaces/contracts in the domain.

For example:

```ts
UserRepository;
```

The domain knows what persistence operations it needs, but not how those operations are implemented.

---

# Application Layer

The application layer contains **use cases**.

A use case represents an action the system can perform.

Examples:

```text
CreateUser
ChangeUserPassword
UpdateCurrentUser
UpdateUserAvatar
DeleteUserAvatar
LoginWithPassword
LoginWithOtp
VerifyOtp
GoogleAuth
GetCurrentUser
SearchUsers
```

Administrative operations are separated into their own group:

```text
admin-users/
├── create-user
├── delete-user
├── get-user
├── list-users
├── update-user
├── get-audit-logs
├── list-audit-logs
├── get-statistics
└── avatar operations
```

This structure keeps authorization and business rules explicit.

Instead of creating a large:

```text
UserService
```

with dozens of unrelated responsibilities, each important operation has a focused use case.

---

# Application Interfaces

External capabilities are represented through application-level interfaces.

Examples include:

```text
PasswordHasher
OtpService
LoginProtection
SessionManager
StorageService
EmailService
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

This makes services such as bcrypt, Redis, SMTP, or MinIO replaceable.

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

## Database

PostgreSQL is accessed through TypeORM.

The infrastructure layer contains:

- ORM entities
- Repository implementations
- Database configuration
- Migrations
- Database bootstrap logic

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

## Redis

Redis is used for short-lived and distributed state such as:

- Sessions
- OTP hashes
- OTP expiration
- OTP attempt counters
- Login protection / failed-login tracking

Sessions are stored server-side.

The browser receives only the session identifier through an HTTP-only cookie.

## SMTP

SMTP is used for OTP delivery.

The application does not directly depend on Nodemailer.

Instead:

```text
OtpService
    ▲
    │
OtpServiceImpl
    │
    ▼
SMTP / Nodemailer
```

## Password hashing

Passwords are hashed using bcrypt through an application abstraction.

Plaintext passwords are never persisted.

## Object storage

Avatar files are handled separately from ordinary user profile updates.

MinIO provides S3-compatible object storage.

Avatar-related operations therefore have their own use cases rather than being mixed into the normal profile update flow.

The application stores the avatar reference while the actual file is handled by the storage infrastructure.

Image processing is supported through Sharp.

---

# Authentication

NestStarter supports multiple authentication flows.

## Email + password

```text
POST /auth/simple-login
```

Passwords are hashed using bcrypt.

Repeated failed password attempts are tracked through Redis-backed login protection.

## OTP authentication

OTP can be used for:

- Signup
- Passwordless login

OTP security includes:

- Hashing before storage
- Expiration
- Maximum verification attempts
- Resend cooldown
- Rate limiting
- Single-use verification

OTP data is stored in Redis rather than PostgreSQL.

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
   └── userId
```

The browser does not contain the authenticated user's identity or authorization state.

The session identifier is stored in the cookie while session data lives in Redis.

This also allows multiple application instances to share session state.

---

# Authorization

Authorization is based on the user's domain role.

Currently:

```text
USER
ADMIN
```

Authenticated routes use the session guard.

Administrative routes additionally use the admin guard.

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
username
dateOfBirth
bio
```

Avatar operations use dedicated use cases because they involve external object storage.

---

# Admin Management

Administrators can manage users through dedicated application use cases.

Supported operations include:

- Create users
- Update users
- Delete users
- Get individual users
- List users
- Reset passwords
- Manage roles
- Manage profiles
- Manage avatars
- View audit logs
- View audit-log lists
- View user statistics

Administrative operations are protected by the admin authorization guard.

Sensitive fields such as password hashes are never exposed through API responses.

---

# Audit Logging

Administrative actions are audit logged.

The audit system provides a record of important administrative activity without coupling the business logic to a particular logging implementation.

This makes it possible to answer questions such as:

```text
Who performed the action?
What action was performed?
Which user/resource was affected?
When did it happen?
```

Audit logging is treated as an application/infrastructure concern rather than putting audit persistence directly into controllers.

---

# API Layer

The API layer is responsible for HTTP concerns.

```text
api/
├── auth/
├── users/
├── admin/
└── health/
```

Controllers should remain thin.

Their job is primarily to:

1. Receive the HTTP request
2. Validate/transform input
3. Call the appropriate use case
4. Return the result

Business rules belong in the application/domain layers.

---

# Validation

Global request validation is enabled using:

- `class-validator`
- `class-transformer`
- NestJS `ValidationPipe`

DTOs define the API contract.

Validation therefore happens at the API boundary before data reaches application logic.

This keeps invalid HTTP input away from the application and domain layers.

---

# Error Handling

Domain exceptions do not know about HTTP.

For example:

```ts
throw new UserNotFoundException();
```

The global exception filter maps that domain error to an HTTP response.

Example:

```json
{
  "statusCode": 404,
  "message": "User not found.",
  "error": "UserNotFoundException",
  "requestId": "..."
}
```

The response format is intentionally stable and includes a request ID for tracing.

HTTP exceptions are also handled consistently.

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
- Request validation
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

The health endpoint verifies essential infrastructure, including:

- PostgreSQL
- Redis

An unhealthy dependency causes the health check to report an unhealthy state.

This makes the endpoint suitable for container/orchestrator health checks.

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
```

See:

```text
.env.example
.env.production.example
```

for the supported configuration.

---

# Database Migrations

TypeORM migrations are used for schema changes.

Available commands:

```bash
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run migration:run:prod
```

Production deployments should use migrations rather than relying on TypeORM schema synchronization.

---

# Docker

Development infrastructure can be started with Docker Compose.

```bash
docker compose up --build
```

This provides the application's supporting infrastructure and API environment.

A production-oriented Compose configuration is also included:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up --build -d
```

The production configuration is designed so PostgreSQL and Redis are not unnecessarily exposed to the host.

---

# Swagger

Swagger/OpenAPI documentation is available during development.

```text
http://localhost:3000/api/docs
```

Swagger provides an interactive description of the API endpoints, request DTOs, and response contracts.

---

# Testing

Jest is used for unit testing.

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

# Project Principles

NestStarter follows several principles.

### Business logic first

The domain and application layers define the behavior of the system.

### Infrastructure is replaceable

PostgreSQL, Redis, SMTP, MinIO, and bcrypt are implementation details.

### Controllers stay thin

Controllers should coordinate HTTP and application use cases, not contain business rules.

### Use cases stay focused

One use case should represent one meaningful operation.

### Domain stays framework-independent

The domain should not require NestJS, TypeORM, Express, Redis, or other infrastructure libraries.

### Explicit dependencies

Dependencies should be visible through constructors and interfaces rather than hidden global state.

### Security by default

Authentication, authorization, password hashing, session storage, validation, rate limiting, and error handling are provided as foundations rather than being left for every project to implement independently.

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

For example, adding a new business feature should generally look like:

```text
Controller
    │
    ▼
UseCase
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

# Technology Stack

| Area              | Technology                      |
| ----------------- | ------------------------------- |
| Runtime           | Node.js                         |
| Framework         | NestJS                          |
| Language          | TypeScript                      |
| Architecture      | Clean Architecture              |
| Database          | PostgreSQL                      |
| ORM               | TypeORM                         |
| Cache / State     | Redis                           |
| Sessions          | express-session + connect-redis |
| Authentication    | Password, OTP, Google OAuth     |
| OAuth             | Passport + Google OAuth 2.0     |
| Password hashing  | bcrypt                          |
| Email             | Nodemailer / SMTP               |
| Object storage    | MinIO                           |
| Image processing  | Sharp                           |
| Validation        | class-validator / Joi           |
| Security headers  | Helmet                          |
| Rate limiting     | NestJS Throttler                |
| API documentation | Swagger / OpenAPI               |
| Testing           | Jest / ts-jest                  |
| Containers        | Docker / Docker Compose         |

---

# Getting Started

## Requirements

- Node.js 20+
- npm
- Docker Desktop

For a local setup without Docker, PostgreSQL and Redis can also be installed separately.

For real OTP delivery, an SMTP account is required.

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

## Start locally

After PostgreSQL and Redis are running:

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
- Review database transaction boundaries for concurrent administrative operations

NestStarter provides the foundation, but production configuration remains application and deployment specific.

---

# What NestStarter Is — and Isn't

NestStarter **is**:

- A reusable NestJS backend foundation
- A Clean Architecture reference implementation
- An authentication and user-management starting point
- A production-oriented infrastructure template
- A foundation for building APIs without repeatedly solving the same backend problems

NestStarter **isn't**:

- A framework
- A complete SaaS application
- A domain-specific business solution
- A replacement for application-specific security review
- A promise that every deployment is production-ready without configuration

The intention is to provide a strong starting point while leaving the actual business domain to the project that uses it.

---

# License

MIT
