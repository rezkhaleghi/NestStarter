import { describe, expect, it, jest } from "@jest/globals";

import { Ticket } from "@domain/entities/ticket.entity";
import { User } from "@domain/entities/user.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { UserRole } from "@domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";
import {
  TicketMustAssignToAdminException,
  TicketNotFoundException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import { AssignTicketUseCase } from "./assign-ticket.use-case";

describe("AssignTicketUseCase", () => {
  const createTicket = () =>
    Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      subject: "Test ticket",
    });

  const createAdmin = () =>
    User.create({
      id: "admin-target-id",
      email: "admin@example.com",
      hashedPassword: "hashed",
      role: UserRole.ADMIN,
      emailVerified: true,
    });

  const createRepositories = () => ({
    ticketRepository: {
      findByIdForUpdate: jest.fn<(id: string) => Promise<Ticket | null>>(),
      save: jest.fn<(ticket: Ticket) => Promise<Ticket>>(),
    },
    userRepository: {
      findById: jest.fn<(id: string) => Promise<User | null>>(),
    },
    auditLogRepository: {
      create: jest.fn<(audit: unknown) => Promise<void>>(),
    },
  });

  const createUnitOfWork = (
    repositories: ReturnType<typeof createRepositories>,
  ) => ({
    execute: jest.fn(async (work: any) => work(repositories)),
  });

  it("assigns a ticket to an active admin and audits the action", async () => {
    const ticket = createTicket();
    const admin = createAdmin();
    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    repositories.userRepository.findById.mockResolvedValue(admin);
    repositories.ticketRepository.save.mockResolvedValue(ticket);

    const unitOfWork = createUnitOfWork(repositories);

    await new AssignTicketUseCase(unitOfWork as any).execute({
      actorUserId: "actor-id",
      ticketId: "ticket-id",
      assignedToUserId: "admin-target-id",
    });

    expect(ticket.assignedToUserId).toBe("admin-target-id");

    expect(
      repositories.ticketRepository.findByIdForUpdate,
    ).toHaveBeenCalledWith("ticket-id");

    expect(repositories.userRepository.findById).toHaveBeenCalledWith(
      "admin-target-id",
    );

    expect(repositories.ticketRepository.save).toHaveBeenCalledWith(ticket);

    const audit = repositories.auditLogRepository.create.mock.calls[0][0] as {
      action: AuditAction;
      actorUserId: string;
      targetUserId: string;
    };

    expect(audit.action).toBe(AuditAction.TICKET_ASSIGNED);
    expect(audit.actorUserId).toBe("actor-id");
    expect(audit.targetUserId).toBe("user-id");
  });

  it("unassigns a ticket when assignedToUserId is null", async () => {
    const ticket = Ticket.create({
      id: "ticket-id",
      userId: "user-id",
      subject: "Test ticket",
      assignedToUserId: "admin-target-id",
    });

    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(ticket);
    repositories.ticketRepository.save.mockResolvedValue(ticket);

    const unitOfWork = createUnitOfWork(repositories);

    await new AssignTicketUseCase(unitOfWork as any).execute({
      actorUserId: "actor-id",
      ticketId: "ticket-id",
      assignedToUserId: null,
    });

    expect(ticket.assignedToUserId).toBeNull();
    expect(repositories.userRepository.findById).not.toHaveBeenCalled();

    const audit = repositories.auditLogRepository.create.mock.calls[0][0] as {
      action: AuditAction;
    };

    expect(audit.action).toBe(AuditAction.TICKET_UNASSIGNED);
  });

  it("throws when the ticket does not exist", async () => {
    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(null);

    const unitOfWork = createUnitOfWork(repositories);

    await expect(
      new AssignTicketUseCase(unitOfWork as any).execute({
        actorUserId: "actor-id",
        ticketId: "ticket-id",
        assignedToUserId: "admin-target-id",
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundException);
  });

  it("throws when the target user does not exist", async () => {
    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(
      createTicket(),
    );
    repositories.userRepository.findById.mockResolvedValue(null);

    const unitOfWork = createUnitOfWork(repositories);

    await expect(
      new AssignTicketUseCase(unitOfWork as any).execute({
        actorUserId: "actor-id",
        ticketId: "ticket-id",
        assignedToUserId: "admin-target-id",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("throws when the target user is not an active admin", async () => {
    const user = User.create({
      id: "user-id",
      email: "user@example.com",
      hashedPassword: "hashed",
      role: UserRole.USER,
      emailVerified: true,
    });

    const repositories = createRepositories();

    repositories.ticketRepository.findByIdForUpdate.mockResolvedValue(
      createTicket(),
    );
    repositories.userRepository.findById.mockResolvedValue(user);

    const unitOfWork = createUnitOfWork(repositories);

    await expect(
      new AssignTicketUseCase(unitOfWork as any).execute({
        actorUserId: "actor-id",
        ticketId: "ticket-id",
        assignedToUserId: "user-id",
      }),
    ).rejects.toBeInstanceOf(TicketMustAssignToAdminException);
  });
});
