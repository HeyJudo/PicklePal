import { describe, expect, it } from "vitest";
import { decideViewAccess } from "../access";

describe("group view access", () => {
  it("allows a public-link group without identity or membership", () => {
    expect(
      decideViewAccess({
        privacyMode: "public_link",
        clerkUserId: null,
        isMember: false,
      }),
    ).toEqual({ canView: true });
  });

  it("requires sign-in before revealing a private group", () => {
    expect(
      decideViewAccess({ privacyMode: "private", clerkUserId: null, isMember: false }),
    ).toEqual({ canView: false, reason: "This group is private. Sign in to view." });
  });

  it("allows only a member to view a private group", () => {
    expect(
      decideViewAccess({ privacyMode: "private", clerkUserId: "user-1", isMember: true }),
    ).toEqual({ canView: true });

    expect(
      decideViewAccess({
        privacyMode: "private",
        clerkUserId: "user-1",
        isMember: false,
      }),
    ).toEqual({
      canView: false,
      reason: "This group is private. Only members can view.",
    });
  });
});
