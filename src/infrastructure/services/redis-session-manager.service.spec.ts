import { describe, expect, it, jest } from "@jest/globals";
import { RedisSessionManager } from "./redis-session-manager.service";

describe("RedisSessionManager", () => {
  const sAdd = jest.fn<(key: string, member: string) => Promise<number>>();
  const sRem = jest.fn<(key: string, member: string) => Promise<number>>();
  const sMembers = jest.fn<(key: string) => Promise<string[]>>();
  const del = jest.fn<(key: string) => unknown>();
  const exec = jest.fn<() => Promise<unknown[]>>();

  const multi = jest.fn(() => ({
    del,
    sRem,
    exec,
  }));

  const redis = {
    sAdd,
    sRem,
    sMembers,
    del,
    multi,
  };

  const service = new RedisSessionManager(redis as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers a session for a user", async () => {
    sAdd.mockResolvedValue(1);

    await service.register("user-id", "session-id");

    expect(sAdd).toHaveBeenCalledWith("auth:sessions:user-id", "session-id");
  });

  it("unregisters a session from a user", async () => {
    sRem.mockResolvedValue(1);

    await service.unregister("user-id", "session-id");

    expect(sRem).toHaveBeenCalledWith("auth:sessions:user-id", "session-id");
  });

  it("destroys every other session while keeping the current session", async () => {
    sMembers.mockResolvedValue([
      "current-session",
      "other-session-1",
      "other-session-2",
    ]);

    exec.mockResolvedValue([]);

    await service.destroyOtherSessions("user-id", "current-session");

    expect(multi).toHaveBeenCalled();

    expect(del).toHaveBeenCalledWith("session:other-session-1");
    expect(del).toHaveBeenCalledWith("session:other-session-2");

    expect(sRem).toHaveBeenCalledWith(
      "auth:sessions:user-id",
      "other-session-1",
    );

    expect(sRem).toHaveBeenCalledWith(
      "auth:sessions:user-id",
      "other-session-2",
    );

    expect(del).not.toHaveBeenCalledWith("session:current-session");

    expect(exec).toHaveBeenCalled();
  });

  it("does nothing when the user has no other sessions", async () => {
    sMembers.mockResolvedValue(["current-session"]);

    await service.destroyOtherSessions("user-id", "current-session");

    expect(multi).not.toHaveBeenCalled();
  });
});
