import { User } from "./user.entity";
import { UserRole } from "../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";
import { GoogleAccountConflictException } from "../exceptions/domain.exception";

describe("User", () => {
  const createUser = () =>
    User.create({
      email: "user@example.com",
      hashedPassword: "hashed-password",
    });

  it("creates a regular active user with default values", () => {
    const user = createUser();

    expect(user.id).toBeDefined();
    expect(user.email).toBe("user@example.com");
    expect(user.hashedPassword).toBe("hashed-password");
    expect(user.role).toBe(UserRole.USER);
    expect(user.emailVerified).toBe(false);
    expect(user.googleId).toBeNull();
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("preserves provided creation values", () => {
    const user = User.create({
      id: "user-1",
      email: "admin@example.com",
      hashedPassword: null,
      role: UserRole.ADMIN,
      emailVerified: true,
      googleId: "google-1",
    });

    expect(user.id).toBe("user-1");
    expect(user.email).toBe("admin@example.com");
    expect(user.hashedPassword).toBeNull();
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.emailVerified).toBe(true);
    expect(user.googleId).toBe("google-1");
  });

  it("updates provided profile fields", () => {
    const user = createUser();
    const dateOfBirth = new Date("2000-01-01");

    user.update({
      firstName: "Reza",
      lastName: "Khaleghi",
      userName: "reza",
      dateOfBirth,
      avatar: "avatar.webp",
      bio: "Software Engineer",
    });

    expect(user.firstName).toBe("Reza");
    expect(user.lastName).toBe("Khaleghi");
    expect(user.userName).toBe("reza");
    expect(user.dateOfBirth).toBe(dateOfBirth);
    expect(user.avatar).toBe("avatar.webp");
    expect(user.bio).toBe("Software Engineer");
  });

  it("clears profile fields when explicitly set to null", () => {
    const user = User.restore({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed-password",
      role: UserRole.USER,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Reza",
      lastName: "Khaleghi",
      userName: "reza",
      dateOfBirth: new Date("2000-01-01"),
      avatar: "avatar.webp",
      bio: "Bio",
      status: UserStatus.ACTIVE,
    });

    user.update({
      firstName: null,
      lastName: null,
      userName: null,
      dateOfBirth: null,
      avatar: null,
      bio: null,
    });

    expect(user.firstName).toBeNull();
    expect(user.lastName).toBeNull();
    expect(user.userName).toBeNull();
    expect(user.dateOfBirth).toBeNull();
    expect(user.avatar).toBeNull();
    expect(user.bio).toBeNull();
  });

  it("does not change profile fields that are undefined", () => {
    const user = User.restore({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed-password",
      role: UserRole.USER,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: "Reza",
      lastName: "Khaleghi",
      userName: "reza",
      dateOfBirth: null,
      avatar: null,
      bio: "Bio",
      status: UserStatus.ACTIVE,
    });

    user.update({
      firstName: undefined,
      userName: undefined,
    });

    expect(user.firstName).toBe("Reza");
    expect(user.userName).toBe("reza");
    expect(user.lastName).toBe("Khaleghi");
    expect(user.bio).toBe("Bio");
  });

  it("changes the email", () => {
    const user = createUser();

    user.changeEmail("new@example.com");

    expect(user.email).toBe("new@example.com");
  });

  it("changes the role", () => {
    const user = createUser();

    user.changeRole(UserRole.ADMIN);

    expect(user.role).toBe(UserRole.ADMIN);
  });

  it("changes email verification state", () => {
    const user = createUser();

    user.setEmailVerified(true);

    expect(user.emailVerified).toBe(true);

    user.setEmailVerified(false);

    expect(user.emailVerified).toBe(false);
  });

  it("changes the password", () => {
    const user = createUser();

    user.changePassword("new-hashed-password");

    expect(user.hashedPassword).toBe("new-hashed-password");
  });

  it("verifies the email", () => {
    const user = createUser();

    user.verifyEmail();

    expect(user.emailVerified).toBe(true);
  });

  it("links a Google account", () => {
    const user = createUser();

    user.linkGoogleAccount("google-1");

    expect(user.googleId).toBe("google-1");
  });

  it("allows linking the same Google account again", () => {
    const user = User.create({
      email: "user@example.com",
      hashedPassword: null,
      googleId: "google-1",
    });

    user.linkGoogleAccount("google-1");

    expect(user.googleId).toBe("google-1");
  });

  it("rejects linking a different Google account", () => {
    const user = User.create({
      email: "user@example.com",
      hashedPassword: null,
      googleId: "google-1",
    });

    expect(() => user.linkGoogleAccount("google-2")).toThrow(
      GoogleAccountConflictException,
    );
  });

  it("activates a restricted user", () => {
    const user = User.restore({
      id: "user-1",
      email: "user@example.com",
      hashedPassword: "hashed-password",
      role: UserRole.USER,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      googleId: null,
      firstName: null,
      lastName: null,
      userName: null,
      dateOfBirth: null,
      avatar: null,
      bio: null,
      status: UserStatus.RESTRICTED,
    });

    user.activate();

    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("restricts an active user", () => {
    const user = createUser();

    user.restrict();

    expect(user.status).toBe(UserStatus.RESTRICTED);
  });
});
