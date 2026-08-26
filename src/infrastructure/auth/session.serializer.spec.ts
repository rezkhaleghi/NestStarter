import { describe, expect, it, jest } from "@jest/globals";
import { SessionSerializer } from "./session.serializer";

describe("SessionSerializer", () => {
  const serializer = new SessionSerializer();

  it("serializes only the user id", () => {
    const done = jest.fn();
    serializer.serializeUser({ id: "user-id" }, done);
    expect(done).toHaveBeenCalledWith(null, "user-id");
  });

  it("deserializes the user id", () => {
    const done = jest.fn();
    serializer.deserializeUser("user-id", done);
    expect(done).toHaveBeenCalledWith(null, "user-id");
  });
});
