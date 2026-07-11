"use client";

import { useState, useTransition, useEffect } from "react";
import { Users, Loader2, X, Shield, Crown } from "lucide-react";
import { getGroupMembers, removeGroupMember } from "./invite-actions";
import type { GroupMember } from "@/lib/membership";

interface MemberManagerProps {
  slug: string;
  /** Whether the current viewer is the group owner (can remove members) */
  isOwner: boolean;
}

export function MemberManager({ slug, isOwner }: MemberManagerProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getGroupMembers(slug);
      if (result.error) {
        setError(result.error);
      } else {
        setMembers(result.members);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleRemove = (profileId: string) => {
    setRemovingId(profileId);
    startTransition(async () => {
      const result = await removeGroupMember(slug, profileId);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.profileId !== profileId));
      } else {
        setError(result.error ?? "Failed to remove member");
      }
      setRemovingId(null);
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-headline text-base font-semibold text-on-background flex items-center gap-2">
          <Users className="h-4 w-4 text-on-surface-variant" />
          Members
        </h3>
        <p className="text-sm text-on-surface-variant mt-1">
          Everyone who can run game days for this group.
          {isOwner && " As owner, you can remove admins."}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading members...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center">
          <p className="text-sm text-on-surface-variant">No members yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <MemberRow
              key={member.profileId}
              member={member}
              isOwner={isOwner}
              isRemoving={removingId === member.profileId}
              isPending={isPending}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MemberRow({
  member,
  isOwner,
  isRemoving,
  isPending,
  onRemove,
}: {
  member: GroupMember;
  isOwner: boolean;
  isRemoving: boolean;
  isPending: boolean;
  onRemove: (profileId: string) => void;
}) {
  const initials = member.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const canRemove = isOwner && member.role !== "owner";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt={member.displayName}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
        )}

        {/* Name + role */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-background truncate">
            {member.displayName}
          </p>
          <RoleBadge role={member.role} />
        </div>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.profileId)}
          disabled={isPending || isRemoving}
          className="cursor-pointer flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant transition-all hover:bg-error/10 hover:text-error disabled:opacity-50 ml-2"
          aria-label={`Remove ${member.displayName}`}
        >
          {isRemoving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Remove
        </button>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: "owner" | "admin" }) {
  if (role === "owner") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ball-yellow font-medium">
        <Crown className="h-3 w-3" />
        Owner
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium">
      <Shield className="h-3 w-3" />
      Admin
    </span>
  );
}
