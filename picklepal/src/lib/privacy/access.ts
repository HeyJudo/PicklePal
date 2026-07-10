import type { PrivacyMode } from "./index";

interface ViewAccessInput {
  readonly privacyMode: PrivacyMode;
  readonly clerkUserId: string | null;
  readonly isMember: boolean;
}

export interface ViewAccessDecision {
  readonly canView: boolean;
  readonly reason?: string;
}

export function decideViewAccess(input: ViewAccessInput): ViewAccessDecision {
  if (input.privacyMode === "public_link") {
    return { canView: true };
  }

  if (!input.clerkUserId) {
    return { canView: false, reason: "This group is private. Sign in to view." };
  }

  if (!input.isMember) {
    return { canView: false, reason: "This group is private. Only members can view." };
  }

  return { canView: true };
}
