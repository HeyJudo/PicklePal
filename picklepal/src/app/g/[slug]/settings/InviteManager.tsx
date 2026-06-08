"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Mail,
  Copy,
  Check,
  X,
  Loader2,
  UserPlus,
  Clock,
  AlertCircle,
} from "lucide-react";
import { sendAdminInvite, getGroupInvites, revokeAdminInvite } from "./invite-actions";
import type { AdminInvite } from "@/lib/invites";

interface InviteManagerProps {
  slug: string;
}

export function InviteManager({ slug }: InviteManagerProps) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Load existing invites
  useEffect(() => {
    async function load() {
      const result = await getGroupInvites(slug);
      if (result.invites) {
        setInvites(result.invites);
      }
      setLoadingInvites(false);
    }
    load();
  }, [slug]);

  const handleSendInvite = () => {
    if (!email.trim()) return;
    setError(null);
    setInviteLink(null);

    startTransition(async () => {
      const result = await sendAdminInvite(slug, email.trim());

      if (result.success && result.inviteLink) {
        setInviteLink(result.inviteLink);
        setEmail("");
        // Refresh invites list
        const updated = await getGroupInvites(slug);
        if (updated.invites) setInvites(updated.invites);
      } else {
        setError(result.error ?? "Failed to send invite");
      }
    });
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = (inviteId: string) => {
    startTransition(async () => {
      const result = await revokeAdminInvite(slug, inviteId);
      if (result.success) {
        setInvites((prev) =>
          prev.map((inv) =>
            inv.id === inviteId ? { ...inv, status: "revoked" as const } : inv,
          ),
        );
      }
    });
  };

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const pastInvites = invites.filter((i) => i.status !== "pending");

  return (
    <section className="space-y-6">
      {/* Send invite form */}
      <div>
        <h3 className="font-headline text-base font-semibold text-on-background mb-1">
          Invite an Admin
        </h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Share a link so someone can join your group as an admin and help run game days.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setInviteLink(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
              placeholder="email@example.com"
              className="w-full rounded-xl border-2 border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-on-background placeholder:text-on-surface-variant/50 outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,122,69,0.08)]"
            />
          </div>
          <button
            type="button"
            onClick={handleSendInvite}
            disabled={isPending || !email.trim()}
            className="cursor-pointer flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-error shrink-0" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        {/* Success — copy link */}
        {inviteLink && (
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary mb-2">
              Invite created! Share this link:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 text-xs text-on-surface-variant border border-border">
                {inviteLink}
              </code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-on-primary transition-all hover:bg-primary/90"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              This link expires in 7 days.
            </p>
          </div>
        )}
      </div>

      {/* Pending invites */}
      {loadingInvites ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invites...
        </div>
      ) : (
        <>
          {pendingInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-on-background mb-3">
                Pending Invites
              </h4>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    onRevoke={handleRevoke}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {pastInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-on-surface-variant mb-3">
                Past Invites
              </h4>
              <div className="space-y-2">
                {pastInvites.slice(0, 10).map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    onRevoke={handleRevoke}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function InviteRow({
  invite,
  onRevoke,
  isPending,
}: {
  invite: AdminInvite;
  onRevoke: (id: string) => void;
  isPending: boolean;
}) {
  const isExpired =
    invite.status === "pending" && new Date(invite.expiresAt) < new Date();
  const displayStatus = isExpired ? "expired" : invite.status;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-on-background truncate">
          {invite.email}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusBadge status={displayStatus} />
          <span className="text-xs text-on-surface-variant">
            {formatRelativeDate(invite.createdAt)}
          </span>
        </div>
      </div>

      {invite.status === "pending" && !isExpired && (
        <button
          type="button"
          onClick={() => onRevoke(invite.id)}
          disabled={isPending}
          className="cursor-pointer flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant transition-all hover:bg-error/10 hover:text-error disabled:opacity-50"
          aria-label="Revoke invite"
        >
          <X className="h-3.5 w-3.5" />
          Revoke
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-ball-yellow/10 px-2 py-0.5 text-xs font-medium text-ball-yellow">
          <Clock className="h-2.5 w-2.5" />
          Pending
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Check className="h-2.5 w-2.5" />
          Accepted
        </span>
      );
    case "revoked":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
          <X className="h-2.5 w-2.5" />
          Revoked
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-on-surface-variant/10 px-2 py-0.5 text-xs font-medium text-on-surface-variant">
          <Clock className="h-2.5 w-2.5" />
          Expired
        </span>
      );
    default:
      return null;
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
