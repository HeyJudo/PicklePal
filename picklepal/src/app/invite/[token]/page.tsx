import { currentUser } from "@clerk/nextjs/server";
import { validateInviteToken } from "@/lib/invites";
import { InviteAcceptClient } from "./InviteAcceptClient";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const user = await currentUser();

  // Validate the token server-side
  const validation = await validateInviteToken(token);

  if (!validation.valid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="font-headline text-xl font-bold text-on-background">
            Invite unavailable
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {validation.error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <InviteAcceptClient
      token={token}
      groupName={validation.groupName ?? "Unknown Group"}
      groupSlug={validation.groupSlug ?? ""}
      inviterName={validation.invite?.inviterName ?? "Someone"}
      role={validation.invite?.role ?? "admin"}
      isSignedIn={!!user}
      userDisplayName={
        user?.firstName
          ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
          : user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? ""
      }
      userAvatarUrl={user?.imageUrl ?? null}
    />
  );
}
