import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, verifyPassword } from "./password";
import { signInSchema, signUpSchema } from "./validation";

describe("password hashing", () => {
  it("verifies the correct password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
  it("uses a fresh salt each time", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
  it("rejects malformed or missing hashes", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "plain")).toBe(false);
  });
  it("token hashing is deterministic", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("auth schemas", () => {
  it("normalises email and enforces password rules", () => {
    const ok = signUpSchema.safeParse({ name: " Dana ", email: " Dana@Example.COM ", password: "longenough", confirm: "longenough" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.email).toBe("dana@example.com");
      expect(ok.data.name).toBe("Dana");
    }
    expect(signUpSchema.safeParse({ name: "D", email: "d@e.com", password: "short", confirm: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "D", email: "d@e.com", password: "longenough", confirm: "different" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});
