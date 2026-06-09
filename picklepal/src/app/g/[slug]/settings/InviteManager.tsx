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
  Link as LinkIcon,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  sendAdminInvite,
  getGroupInvites,
  revokeAdminInvite,
  createGroupInviteLink,
  getActiveInviteLink,
} from "./invite-actions";
import type { AdminInvite } from "@/lib/invites";

interface InviteManagerProps {
  slug: string;
  /** The group's privacy setting — used to describe the view-only link */
  privacy?: "public_link" | "private";
}

export function InviteManager({ slug, privacy = "public_link" }: InviteManagerProps) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  const viewOnlyLink = `${baseUrl}/g/${slug}`;

  // ── View-only copy state ───────────────────────────────────────────────────
  const [copiedViewOnly, setCopiedViewOnly] = useState(false);

  // ── Admin link state ──────────────────────────────────────────────────────
  const [adminLink, setAdminLink] = useState<string | null>(null);
  const [adminLinkInviteId, setAdminLinkInviteId] = useState<string | null>(null);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [adminLinkPending, startAdminLinkTransition] = useTransition();
  const [adminLinkError, setAdminLinkError] = useState<string | null>(null);
  const [loadingAdminLink, setLoadingAdminLink] = useState(true);

  // ── Email invite state ────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailPending, startEmailTransition] = useTransition();
  const [emailInviteLink, setEmailInviteLink] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // ── Invite list state ─────────────────────────────────────────────────────
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load existing invites + check for active link invite
  useEffect(() => {
    async function load() {
      const [invitesResult, linkResult] = await Promise.all([
        getGroupInvites(slug),
        getActiveInviteLink(slug),
      ]);
      if (invitesResult.invites) setInvites(invitesResult.invites);
      if (linkResult.inviteId) setAdminLinkInviteId(linkResult.inviteId);
      setLoadingInvites(false);
      setLoadingAdminLink(false);
    }
    load();
  }, [slug]);

  // ── Copy helpers ──────────────────────────────────────────────────────────
  const copyToClipboard = async (text: string, onCopied: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    onCopied();
  };

  const handleCopyViewOnly = () => {
    copyToClipboard(viewOnlyLink, () => {
      setCopiedViewOnly(true);
      setTimeout(() => setCopiedViewOnly(false), 2000);
    });
  };

  const handleCopyAdmin = () => {
    if (!adminLink) return;
    copyToClipboard(adminLink, () => {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    });
  };

  const handleCopyEmail = () => {
    if (!emailInviteLink) return;
    copyToClipboard(emailInviteLink, () => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    });
  };

  // ── Admin link generation ─────────────────────────────────────────────────
  const handleGenerateAdminLink = () => {
    setAdminLinkError(null);
    startAdminLinkTransition(async () => {
      const result = await createGroupInviteLink(slug);
      if (result.success && result.inviteLink) {
        setAdminLink(result.inviteLink);
        setAdminLinkInviteId(null); // will be refreshed on next load
      } else {
        setAdminLinkError(result.error ?? "Failed to generate link");
      }
    });
  };

  const handleRevokeAdminLink = () => {
    if (!adminLinkInviteId) return;
    startAdminLinkTransition(async () => {
      const result = await revokeAdminInvite(slug, adminLinkInviteId);
      if (result.success) {
        setAdminLink(null);
        setAdminLinkInviteId(null);
        const updated = await getGroupInvites(slug);
        if (updated.invites) setInvites(updated.invites);
      }
    });
  };

  // ── Email invite send ─────────────────────────────────────────────────────
  const handleSendInvite = () => {
    if (!email.trim()) return;
    setEmailError(null);
    setEmailInviteLink(null);

    startEmailTransition(async () => {
      const result = await sendAdminInvite(slug, email.trim());
      if (result.success && result.inviteLink) {
        setEmailInviteLink(result.inviteLink);
        setEmail("");
        const updated = await getGroupInvites(slug);
        if (updated.invites) setInvites(updated.invites);
      } else {
        setEmailError(result.error ?? "Failed to send invite");
      }
    });
  };

  // ── Invite revoke ─────────────────────────────────────────────────────────
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

  const emailInvites = invites.filter((i) => i.kind === "email" || i.email !== null);
  const pendingEmailInvites = emailInvites.filter((i) => i.status === "pending");
  const pastEmailInvites = emailInvites.filter((i) => i.status !== "pending");

  return (
    <section className="space-y-8">
      {/* ── Block 1: View-only link ────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-on-surface-variant" />
          <h3 className="font-headline text-base font-semibold text-on-background">
            View-only link
          </h3>
        </div>
        {privacy === "private" ? (
          <p className="text-sm text-on-surface-variant mb-3">
            This group is private. Only members can view it.
          </p>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant mb-3">
              Anyone with this link can view live scores &amp; standings. They cannot score or edit.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-on-surface-variant">
                {viewOnlyLink}
              </code>
              <button
                type="button"
                onClick={handleCopyViewOnly}
                className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2.5 text-xs font-medium text-on-background transition-all hover:bg-surface-container-high"
              >
                {copiedViewOnly ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-primary" />
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
          </>
        )}
      </div>

      {/* ── Block 2: Admin link ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="h-4 w-4 text-on-surface-variant" />
          <h3 className="font-headline text-base font-semibold text-on-background">
            Admin link
          </h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-3">
          Anyone who opens this link and signs in becomes an admin and can run game days. Revoke anytime.
        </p>

        {adminLinkError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-error shrink-0" />
            <p className="text-xs text-error">{adminLinkError}</p>
          </div>
        )}

        {loadingAdminLink ? (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </div>
        ) : adminLink ? (
          /* Just generated — show the link */
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-medium text-primary">Admin link ready. Share it carefully:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 text-xs text-on-surface-variant border border-border">
                {adminLink}
              </code>
              <button
                type="button"
                onClick={handleCopyAdmin}
                className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-on-primary transition-all hover:bg-primary/90"
              >
                {copiedAdmin ? (
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
            <p className="text-xs text-on-surface-variant">Expires in 30 days.</p>
          </div>
        ) : adminLinkInviteId ? (
          /* Active link exists but we don't have the raw token — show revoke option */
          <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-on-background">Active admin link</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                A link is active. Regenerate to get a new shareable URL.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleGenerateAdminLink}
                disabled={adminLinkPending}
                className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-on-background transition-all hover:bg-surface-container-high disabled:opacity-50"
              >
                {adminLinkPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Regenerate
              </button>
              <button
                type="button"
                onClick={handleRevokeAdminLink}
                disabled={adminLinkPending}
                className="cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-on-surface-variant transition-all hover:bg-error/10 hover:text-error disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Revoke
              </button>
            </div>
          </div>
        ) : (
          /* No active link */
          <button
            type="button"
            onClick={handleGenerateAdminLink}
            disabled={adminLinkPending}
            className="cursor-pointer flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adminLinkPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            Generate admin link
          </button>
        )}
      </div>

      {/* ── Block 3: Email invite ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-on-surface-variant" />
          <h3 className="font-headline text-base font-semibold text-on-background">
            Invite by email
          </h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          Send a targeted invite to a specific person. They must accept with the matching email.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
                setEmailInviteLink(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
              placeholder="email@example.com"
              className="w-full rounded-xl border-2 border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-on-background placeholder:text-on-surface-variant/50 outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,122,69,0.08)]"
            />
          </div>
          <button
            type="button"
            onClick={handleSendInvite}
            disabled={emailPending || !email.trim()}
            className="cursor-pointer flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emailPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>

        {emailError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-error shrink-0" />
            <p className="text-xs text-error">{emailError}</p>
          </div>
        )}

        {emailInviteLink && (
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary mb-2">
              Invite created! Share this link with them:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 text-xs text-on-surface-variant border border-border">
                {emailInviteLink}
              </code>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-on-primary transition-all hover:bg-primary/90"
              >
                {copiedEmail ? (
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
              This link expires in 7 days and can only be accepted by the invited email.
            </p>
          </div>
        )}
      </div>

      {/* ── Pending + past email invites ──────────────────────────────── */}
      {loadingInvites ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invites...
        </div>
      ) : (
        <>
          {pendingEmailInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-on-background mb-3">
                Pending Email Invites
              </h4>
              <div className="space-y-2">
                {pendingEmailInvites.map((invite) => (
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

          {pastEmailInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-on-surface-variant mb-3">
                Past Email Invites
              </h4>
              <div className="space-y-2">
                {pastEmailInvites.slice(0, 10).map((invite) => (
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
          {invite.email ?? "Link invite"}
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
