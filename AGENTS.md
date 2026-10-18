# NestStarter — Project Rules for AI Agents

## Project Purpose

NestStarter is a reusable NestJS backend boilerplate. Developers clone it, customize its domain and features, and turn it into their own backend application.

It is not a finished production application, and it does not manage a production database or production data.

## Database and Schema Policy

- Keep TypeORM `synchronize: true` as the default for the starter's development workflow.
- Do not introduce database migration files or generate migrations as part of ordinary feature development.
- Do not recommend migrations as a prerequisite for the starter to work.
- Assume a fresh, disposable development database unless the user explicitly states otherwise.
- Keep the TypeORM CLI data source consistent with the intended starter development workflow.
- Do not disable schema synchronization or replace it with a migration workflow without explicit user approval.
- Do not delete, reset, or recreate databases or Docker volumes without explicit approval.

### Important distinction

The starter's default configuration is for development and local experimentation. When a developer customizes the project for a production application containing persistent data, they are responsible for choosing and configuring an appropriate schema-evolution strategy. Migrations may be introduced at that stage, but they are not a default requirement of NestStarter.

## Production Templates

- Treat Docker Compose production configuration as a template for a customized application, not proof that an unmodified clone is production-ready.
- Do not add migration execution commands that depend on migration files absent from the repository.
- Clearly document any setup steps developers must complete after customizing the boilerplate.
- Do not silently change development defaults to production-oriented architecture.

## General Engineering Rules

- Inspect the existing code and configuration before proposing changes.
- Preserve the existing Clean Architecture boundaries and conventions.
- Avoid unnecessary abstractions, rewrites, and new dependencies.
- Make the smallest complete change that solves the actual problem.
- Add or update relevant tests for behavior changes.
- Never push commits unless the user explicitly asks.
- Explain any trade-offs that affect security, data integrity, or production deployment.
