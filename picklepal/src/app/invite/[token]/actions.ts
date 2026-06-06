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

  const result = await acceptInvite(
    token,
    user.id,
    displayName,
    user.imageUrl ?? null,
  );

  return result;
}
