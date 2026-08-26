import { describe, expect, it } from "@jest/globals";
import { BcryptPasswordHasher } from "./bcrypt-password-hasher.service";

describe("BcryptPasswordHasher", () => {
  it("hashes and verifies a password", async () => {
    const service = new BcryptPasswordHasher();
    const hash = await service.hash("correct-password");

    await expect(service.compare("correct-password", hash)).resolves.toBe(true);
    await expect(service.compare("wrong-password", hash)).resolves.toBe(false);
    expect(hash).not.toBe("correct-password");
  });
});
