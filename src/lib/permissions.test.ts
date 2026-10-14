import { describe, expect, it } from "vitest";
import { canEdit, canManage, resolveAccess } from "./permissions";

const doc = { ownerId: "alice" };
const shares = [
  { userId: "bob", role: "EDITOR" as const },
  { userId: "carol", role: "VIEWER" as const },
];

describe("resolveAccess", () => {
  it("gives the owner the owner role regardless of shares", () => {
    expect(resolveAccess(doc, shares, "alice")).toBe("owner");
  });
  it("maps EDITOR shares to editor", () => {
    expect(resolveAccess(doc, shares, "bob")).toBe("editor");
  });
  it("maps VIEWER shares to viewer", () => {
    expect(resolveAccess(doc, shares, "carol")).toBe("viewer");
  });
  it("denies users with no share", () => {
    expect(resolveAccess(doc, shares, "dave")).toBeNull();
    expect(resolveAccess(doc, [], "bob")).toBeNull();
  });
});

describe("capabilities", () => {
  it("owner and editor can edit, viewer cannot", () => {
    expect(canEdit("owner")).toBe(true);
    expect(canEdit("editor")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });
  it("only the owner can manage sharing and deletion", () => {
    expect(canManage("owner")).toBe(true);
    expect(canManage("editor")).toBe(false);
    expect(canManage("viewer")).toBe(false);
  });
});
