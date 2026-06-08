"use server";

import { createClient } from "@supabase/supabase-js";
import { authorizeGroupWrite } from "@/lib/auth";
import { checkSlugAvailability } from "@/app/onboarding/actions";
import type { GroupSettings } from "@/lib/supabase";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

const DEFAULT_SETTINGS: GroupSettings = {
  default_match_type: "doubles",
  default_target_score: 11,
  default_win_by: 2,
  qualification_threshold: 3,
};

// --- Get group settings ---
export async function getGroupSettings(slug: string): Promise<{
  data: { id: string; name: string; slug: string; settings: GroupSettings } | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("groups")
    .select("id, name, slug, settings")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return { data: null, error: "Group not found" };

  return {
    data: {
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    },
    error: null,
  };
}

// --- Update group name ---
export async function updateGroupName(
  slug: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await authorizeGroupWrite(slug, { requireOwner: true });
  if (!auth.authorized) return { success: false, error: auth.error };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: "Name must be at least 2 characters" };
  }
  if (trimmed.length > 50) {
    return { success: false, error: "Name must be 50 characters or less" };
  }

  const supabase = getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("groups")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// --- Update group slug ---
export async function updateGroupSlug(
  currentSlug: string,
  newSlug: string,
): Promise<{ success: boolean; error?: string; newSlug: string | null }> {
  const auth = await authorizeGroupWrite(currentSlug, { requireOwner: true });
  if (!auth.authorized) return { success: false, error: auth.error, newSlug: null };

  const trimmed = newSlug.trim().toLowerCase();
  if (trimmed === currentSlug) {
    return { success: true, newSlug: currentSlug };
  }

  const availability = await checkSlugAvailability(trimmed);
  if (!availability.available) {
    return { success: false, error: availability.error, newSlug: null };
  }

  const supabase = getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("groups")
    .update({ slug: trimmed, updated_at: new Date().toISOString() })
    .eq("slug", currentSlug);

  if (error) return { success: false, error: error.message, newSlug: null };
  return { success: true, newSlug: trimmed };
}

// --- Update game defaults ---
export async function updateGameDefaults(
  slug: string,
  settings: GroupSettings,
): Promise<{ success: boolean; error?: string }> {
  const auth = await authorizeGroupWrite(slug);
  if (!auth.authorized) return { success: false, error: auth.error };

  // Validate
  if (!["singles", "doubles"].includes(settings.default_match_type)) {
    return { success: false, error: "Invalid match type" };
  }
  if (![11, 15, 21].includes(settings.default_target_score)) {
    return { success: false, error: "Target score must be 11, 15, or 21" };
  }
  if (![1, 2, 3].includes(settings.default_win_by)) {
    return { success: false, error: "Win-by must be 1, 2, or 3" };
  }
  if (
    !Number.isInteger(settings.qualification_threshold) ||
    settings.qualification_threshold < 1 ||
    settings.qualification_threshold > 20
  ) {
    return { success: false, error: "Qualification threshold must be 1–20" };
  }

  const supabase = getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("groups")
    .update({ settings, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
