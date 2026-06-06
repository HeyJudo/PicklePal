import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

interface PrivateGroupGateProps {
  reason?: string;
}

export function PrivateGroupGate({ reason }: PrivateGroupGateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        {/* Lock icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-on-surface-variant/10">
          <Lock className="h-8 w-8 text-on-surface-variant" />
        </div>

        <h1 className="font-headline text-xl font-bold text-on-background">
          Private Group
        </h1>

        <p className="mt-2 text-sm text-on-surface-variant max-w-xs mx-auto">
          {reason ?? "This group is private. Only members can view its content."}
        </p>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <SignInButton mode="modal">
            <button
              type="button"
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              Sign in
            </button>
          </SignInButton>

          <Link
            href="/"
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
