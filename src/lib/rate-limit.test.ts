import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("allows up to the limit inside a window and blocks after", () => {
    let now = 0;
    const limiter = createRateLimiter(3, 1000, () => now);
    expect(limiter.check("a")).toBe(true);
    expect(limiter.check("a")).toBe(true);
    expect(limiter.check("a")).toBe(true);
    expect(limiter.check("a")).toBe(false);
    expect(limiter.check("b")).toBe(true); // independent key
    now = 1001;
    expect(limiter.check("a")).toBe(true); // window rolled over
  });
  it("reset clears a key", () => {
    const limiter = createRateLimiter(1, 1000, () => 0);
    expect(limiter.check("x")).toBe(true);
    expect(limiter.check("x")).toBe(false);
    limiter.reset("x");
    expect(limiter.check("x")).toBe(true);
  });
});
