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

import { revalidateTag } from "next/cache";
import { createServerClient } from "@/lib/supabase";

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
