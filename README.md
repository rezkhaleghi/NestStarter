| POST | `/auth/change-password` | Change the authenticated user's password |
| PATCH | `/admin/users/:id/password` | Reset a user's password |

# NestJS Clean Architecture API

A NestJS authentication and user-management API using Clean Architecture,
PostgreSQL, Redis, SMTP email, cookie-based sessions, and Google OAuth.

## Features

- Email/password signup and login.
- Email verification state is persisted and can be managed by administrators.
- Email OTP signup and passwordless login.
- OTP hashes stored in Redis with expiration and attempt limits.
- OTP delivery through SMTP, including Gmail App Password support.
- Sessions stored in Redis and identified by an HTTP-only cookie.
- Google OAuth login and signup.
- Safe current-user profile endpoint.
- Admin-only user CRUD with pagination.
- Password hashing with bcrypt.
- Request validation with `class-validator`.
- Global throttling for abuse-sensitive endpoints.
- Redis-backed account lockout after repeated failed password logins.
- OTP expiration, maximum attempts, and resend cooldown.
- Database and Redis health checks at `/health`.
- Environment validation with Joi.
- Swagger documentation.

## Requirements

- Node.js 20 or newer.
- npm.
- Docker Desktop, or locally installed PostgreSQL and Redis.
- An SMTP account for real OTP email delivery. Gmail is free for this use with
  a Google App Password.

## Architecture

```text
src/
   domain/
      entities/       Framework-free business entities
      enums/          Domain enums
      exceptions/     Domain errors
      repositories/   Persistence contracts
   application/
      dtos/           Use-case input models
      interfaces/     Ports implemented by infrastructure
      use-cases/      Focused application operations
   infrastructure/
      auth/           Passport adapters
      config/         Database configuration
      database/       TypeORM entities, repositories, and bootstrap
      services/       SMTP, Redis OTP, and password adapters
   api/
      auth/           Authentication controller and DTOs
      admin/          Admin guard, controller, module, and DTOs
```

Dependency direction:

```text
API -> application -> domain
Infrastructure -> application and domain
```

Controllers call use cases. Use cases depend on domain contracts such as
`UserRepository`, `PasswordHasher`, and `OtpService`. Infrastructure binds
those contracts to TypeORM, bcrypt, Redis, and SMTP implementations.

## Local setup

Install dependencies and create the environment file:

```bash
npm install
cp .env.example .env
```

## Docker setup

Make sure `.env` contains the required application settings, then start the
API, PostgreSQL, and Redis together:

```bash
docker compose up --build
```

The API runs at `http://localhost:3000` and Swagger is available at
`http://localhost:3000/api/docs`. Stop the containers with:

```bash
docker compose down
```

Database and Redis data are kept in named Docker volumes. To remove the data
as well as the containers, use `docker compose down -v`.

For a production-like Compose deployment, create `.env.production` from
`.env.production.example`, replace every placeholder with real production
values, and run:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up --build -d
```

The migration CLI reads variables from the environment supplied by Compose;
the application container is the only service that receives the full
`.env.production` file.

The production Compose file runs migrations before starting the API and does
not publish PostgreSQL or Redis ports. Stop it with:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml down
```

Start PostgreSQL and Redis with Docker:

```bash
docker run --name nest-postgres \
   -e POSTGRES_USER=postgres \
   -e POSTGRES_PASSWORD=postgres \
   -e POSTGRES_DB=nest_clean_arch \
   -p 5432:5432 \
   -v nest-postgres-data:/var/lib/postgresql/data \
   -d postgres:16

docker run --name nest-redis \
   -p 6379:6379 \
   -v nest-redis-data:/data \
   -d redis:7-alpine
```

If the containers already exist, start them instead:

```bash
docker start nest-postgres
docker start nest-redis
```

Check both services:

```bash
docker ps
docker exec nest-redis redis-cli ping
```

Redis should respond with `PONG`.

## Environment configuration

`.env.example` contains every supported variable. At minimum, configure:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nest_clean_arch

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM=your-gmail-address@gmail.com

SESSION_SECRET=at-least-32-random-characters
```

Never use a normal Gmail password. Create a Google App Password after enabling
two-step verification. Never commit `.env`, passwords, or App Passwords.

For local development, SMTP failure can optionally leave the OTP in Redis and
print it to the terminal:

```env
OTP_LOG_CODE=true
NODE_ENV=development
```

Keep this disabled in production. OTP logging is automatically disabled when
`NODE_ENV=production`.

## Start the API

```bash
npm run start:dev
```

The API runs at `http://localhost:3000` by default. Swagger is available at:

`http://localhost:3000/api/docs`

Useful npm scripts:

```bash
npm run build
npm run start
npm run start:prod
npm test -- --runInBand
```

## Authentication API

| Method | Route                   | Purpose                                 |
| ------ | ----------------------- | --------------------------------------- |
| POST   | `/auth/request-otp`     | Send an OTP to an email                 |
| POST   | `/auth/sign-up`         | Verify OTP and create a user            |
| POST   | `/auth/login-email`     | Login with email and password           |
| POST   | `/auth/login-otp`       | Login with email and OTP                |
| GET    | `/auth/google`          | Start Google OAuth                      |
| GET    | `/auth/google/callback` | Complete Google OAuth                   |
| GET    | `/auth/profile`         | Return the authenticated user's profile |
| POST   | `/auth/logout`          | Destroy the current session             |

### Request an OTP

```bash
curl -X POST http://localhost:3000/auth/request-otp \
   -H "Content-Type: application/json" \
   -d '{"email":"user@gmail.com"}'
```

The OTP is sent by SMTP. With `OTP_LOG_CODE=true` in development, a failed
SMTP delivery logs the code and leaves its Redis record available for testing.
OTP requests are throttled globally and per email through the configured resend
cooldown. Invalid OTPs are limited by `OTP_MAX_ATTEMPTS` and expire after
`OTP_EXPIRY_SECONDS`.

### Signup

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/sign-up \
   -H "Content-Type: application/json" \
   -d '{
      "email":"user@gmail.com",
      "password":"strongPassword123",
      "otp":"123456"
   }'
```

Successful signup creates the user and logs the user in. The response includes
an HTTP-only `connect.sid` cookie when a cookie-aware client is used.

### Email/password login

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login-email \
   -H "Content-Type: application/json" \
   -d '{
      "email":"user@gmail.com",
      "password":"strongPassword123"
   }'
```

### OTP login

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login-otp \
   -H "Content-Type: application/json" \
   -d '{
      "email":"user@gmail.com",
      "otp":"123456"
   }'
```

OTP verification is single-use. A valid OTP is deleted atomically from Redis.

### Profile and logout

Send the saved cookie with subsequent requests:

```bash
curl -b cookies.txt http://localhost:3000/auth/profile
curl -b cookies.txt -X POST http://localhost:3000/auth/logout
```

The profile response contains `id`, `email`, `role`, and `createdAt`. It never
contains `password` or `hashedPassword`.

### Admin list sorting and pagination

`GET /admin/users` accepts `page`, `limit`, `sortBy` (`createdAt`, `email`, or
`role`), and `sortDirection` (`ASC` or `DESC`). The response includes `data`,
`total`, and `totalPages`. The shared `PageQuery` and `PageResult` contracts can
be reused by repository implementations for other models.

### Health

`GET /health` checks PostgreSQL and Redis and returns an unhealthy response when
either essential service cannot be reached.

Sessions use Redis, not process memory. The cookie contains only a session ID;
the authenticated user ID is stored server-side.

## Admin user management

Every admin route requires a valid session whose user has the `admin` role.

| Method | Route                          | Purpose                         |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/admin/users?page=1&limit=20` | List users                      |
| GET    | `/admin/users/:id`             | Get one user                    |
| POST   | `/admin/users`                 | Create a user or admin          |
| PATCH  | `/admin/users/:id`             | Update email, password, or role |
| DELETE | `/admin/users/:id`             | Delete a user                   |

Responses never include password hashes. Pagination accepts `page` from 1 and
`limit` from 1 through 100.

### Create the first admin

For a new database, temporarily set these values in `.env`:

```env
INITIAL_ADMIN_EMAIL=admin@gmail.com
INITIAL_ADMIN_PASSWORD=a-strong-password-at-least-12-chars
```

Start the API once. The startup bootstrap creates the admin only when the email
does not already exist. Then remove or clear both variables and restart the
application. The admin record remains in PostgreSQL.

### Use the admin API

Login and save the session cookie:

```bash
curl -c admin-cookies.txt -X POST http://localhost:3000/auth/login-email \
   -H "Content-Type: application/json" \
   -d '{
      "email":"admin@gmail.com",
      "password":"a-strong-password-at-least-12-chars"
   }'
```

List users:

```bash
curl -b admin-cookies.txt \
   "http://localhost:3000/admin/users?page=1&limit=20"
```

Create another admin:

```bash
curl -b admin-cookies.txt -X POST http://localhost:3000/admin/users \
   -H "Content-Type: application/json" \
   -d '{
      "email":"another-admin@gmail.com",
      "password":"another-strong-password",
      "role":"admin"
   }'
```

## Data ownership

```text
PostgreSQL -> users, password hashes, roles, creation dates
Redis      -> OTP hashes, OTP expiration, OTP attempt counters, sessions
SMTP       -> delivery of the plain OTP email
Browser    -> HTTP-only connect.sid session cookie
```

OTP values are not stored in plaintext. Passwords are not stored in plaintext.

## Error responses

The API validates request bodies and query parameters globally. Common status
codes are:

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| 400    | Invalid request, expired OTP, or protected admin operation |
| 401    | Missing session or invalid credentials/OTP                 |
| 403    | Authenticated user is not an administrator                 |
| 404    | User does not exist                                        |
| 409    | Duplicate email or unsafe admin state change               |
| 429    | Request throttled                                          |

Infrastructure failures such as database, Redis, or SMTP outages are not
silently converted into invalid-credential responses.

## Testing and quality checks

Run the current checks with:

```bash
npm test -- --runInBand
npm run build
```

The existing unit tests cover password login, OTP login, email normalization,
invalid credentials, and invalid OTP behavior. Integration tests should be
added before production for PostgreSQL, Redis, SMTP failure, session persistence,
admin authorization, and concurrent last-admin changes.

## Production checklist

- Use a new random `SESSION_SECRET` with at least 32 characters.
- Revoke any SMTP App Password that was exposed and generate a new one.
- Keep `OTP_LOG_CODE=false`.
- Use HTTPS so production cookies can use `secure=true`.
- Keep `.env` outside version control.
- Use PostgreSQL migrations instead of TypeORM `synchronize`.
- Run Redis with authentication and a network policy.
- Move throttler storage to Redis when running multiple API instances.
- Add transaction/locking protection around last-admin changes.
- Review and upgrade dependencies before deployment.
- Add audit logging for administrator actions.

## Adding a feature

1. Add domain entities, enums, exceptions, or repository contracts when needed.
2. Add focused application use cases and application input models.
3. Implement infrastructure adapters without leaking them into application code.
4. Add API DTOs, controllers, guards, and a feature module.
5. Register providers in the appropriate module.
6. Add unit and integration tests for the behavior.

Avoid large generic services that combine unrelated authentication, user, and
administration workflows. Focused use cases keep permissions and business
rules explicit and independently testable.

# NestStarter
