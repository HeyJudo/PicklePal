"use server";

import { currentUser } from "@clerk/nextjs/server";
import { acceptInvite } from "@/lib/invites";

export async function acceptInviteAction(token: string): Promise<{
  success: boolean;
  groupSlug?: string;
  groupName?: string;
  error?: string;
}> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in to accept an invite" };
  }

  const displayName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "User";

  // Collect only verified email addresses for ownership check
  const verifiedEmails = user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress);

  const result = await acceptInvite(
    token,
    user.id,
    displayName,
    verifiedEmails,
    user.imageUrl ?? null,
  );

  return result;
}
