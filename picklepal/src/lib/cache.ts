/**
 * Shared cache invalidation helpers for the group section.
 *
 * Convention: every server action that writes group data calls
 * `revalidateGroupCache(groupId)` after a successful DB write.
 * Actions that already hold the group slug call `revalidateGroupCacheBySlug(slug)` directly.
 *
 * Cache tag format: `group-{slug}`
 * The slug is resolved from the group ID via a single DB lookup.
 */

import { revalidateTag, updateTag } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { tagsForMutation, type CacheMutation } from "@/lib/cache/policy";

export {
  CACHE_DOMAINS,
  cacheTag,
  domainsForMutation,
  tagsForMutation,
  type CacheDomain,
  type CacheMutation,
} from "@/lib/cache/policy";

/**
 * Invalidate all cached group-section pages for the given group slug.
 * Use this in write actions that already know the slug.
 */
export function revalidateGroupCacheBySlug(slug: string): void {
  revalidateTag(`group-${slug}`, {});
}

/**
 * Resolve the group slug from a group ID, then invalidate all cached
 * group-section pages for that group.
 * Use this in write actions that only have the group ID (most write actions).
 */
export async function revalidateGroupCache(groupId: string): Promise<void> {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("groups")
      .select("slug")
      .eq("id", groupId)
      .maybeSingle();

    if (data?.slug) {
      revalidateTag(`group-${data.slug}`, {});
    }
  } catch {
    // Never let cache invalidation failures surface to the caller.
    // The 5-minute TTL will catch up on its own.
  }
}

/**
 * Expire only the read domains affected by a mutation. This uses updateTag so
 * the Server Action that performed the write gets read-your-own-writes
 * behavior on its next render. The broad legacy helpers above remain during
 * the expand/contract migration and are removed only after every caller moves
 * to this contract.
 */
export function invalidateGroupMutationBySlug(
  slug: string,
  mutation: CacheMutation,
  recapResourceKey?: string,
): boolean {
  const tags = tagsForMutation(mutation, slug, recapResourceKey);

  try {
    for (const tag of tags) {
      updateTag(tag);
    }
    return true;
  } catch (error) {
    console.error("[cache] targeted invalidation failed", {
      mutation,
      tags,
      error,
    });
    return false;
  }
}

/** Resolve a group slug and apply the targeted invalidation contract. */
export async function invalidateGroupMutation(
  groupId: string,
  mutation: CacheMutation,
  recapResourceKey?: string,
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("groups")
      .select("slug")
      .eq("id", groupId)
      .maybeSingle();

    if (error || !data?.slug) {
      console.error("[cache] could not resolve group for targeted invalidation", {
        groupId,
        mutation,
        error,
      });
      return false;
    }

    return invalidateGroupMutationBySlug(data.slug, mutation, recapResourceKey);
  } catch (error) {
    console.error("[cache] targeted invalidation failed before tag update", {
      groupId,
      mutation,
      error,
    });
    return false;
  }
}
