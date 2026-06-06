"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { Check, ArrowRight, Loader2, Shield, Users } from "lucide-react";
import { acceptInviteAction } from "./actions";

interface InviteAcceptClientProps {
  token: string;
  groupName: string;
  groupSlug: string;
  inviterName: string;
  role: "owner" | "admin";
  isSignedIn: boolean;
  userDisplayName: string;
  userAvatarUrl: string | null;
}

export function InviteAcceptClient({
  token,
  groupName,
  groupSlug,
  inviterName,
  role,
  isSignedIn,
  userDisplayName,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInviteAction(token);

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push(`/g/${result.groupSlug ?? groupSlug}`);
        }, 1800);
      } else {
        setStatus("error");
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  // Success state
  if (status === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Check className="h-8 w-8 text-on-primary" strokeWidth={3} />
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-background">
            You&apos;re in!
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Welcome to <span className="font-semibold text-on-background">{groupName}</span>.
            Redirecting you now...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[100px] -translate-y-1/2 translate-x-1/3" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="font-headline text-base font-bold text-on-background tracking-tight">
            DinkDay
          </span>
        </div>

        {/* Invite card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {/* Group icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-center font-headline text-xl font-bold text-on-background">
            Join {groupName}
          </h1>

          <p className="mt-2 text-center text-sm text-on-surface-variant">
            <span className="font-medium text-on-background">{inviterName}</span>{" "}
            invited you to join as {role === "owner" ? "an owner" : "an admin"}.
          </p>

          {/* Role badge */}
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" />
              {role === "owner" ? "Owner" : "Admin"} access
            </span>
          </div>

          {/* What you can do */}
          <div className="mt-6 rounded-xl bg-surface-container-low/50 px-4 py-3">
            <p className="text-xs font-medium text-on-surface-variant mb-2">
              As an admin you can:
            </p>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Start and manage game day sessions
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Score matches courtside
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Add and manage players
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Record historical matches
              </li>
            </ul>
          </div>

          {/* Action area */}
          <div className="mt-6">
            {isSignedIn ? (
              <button
                type="button"
                onClick={handleAccept}
                disabled={isPending}
                className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Accept Invite
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-xs text-on-surface-variant">
                  Sign in or create an account to accept this invite.
                </p>
                <SignInButton
                  mode="modal"
                  forceRedirectUrl={`/invite/${token}`}
                >
                  <button
                    type="button"
                    className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                  >
                    Sign in to accept
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
              <p className="text-xs text-error">{error}</p>
            </div>
          )}
        </div>

        {/* Signed in as */}
        {isSignedIn && userDisplayName && (
          <p className="mt-4 text-center text-xs text-on-surface-variant">
            Signed in as <span className="font-medium text-on-background">{userDisplayName}</span>
          </p>
        )}
      </div>
    </main>
  );
}
