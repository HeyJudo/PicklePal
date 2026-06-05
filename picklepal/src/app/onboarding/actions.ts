"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

interface CreateGroupInput {
  name: string;
  slug: string;
  players: string[];
  includeSelf: boolean;
}

interface CreateGroupResult {
  success: boolean;
  slug?: string;
  error?: string;
}

const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "admin",
  "settings",
  "onboarding",
  "sign-in",
  "sign-up",
  "default",
  "demo",
  "help",
  "support",
  "about",
  "terms",
  "privacy",
]);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean;
  error?: string;
}> {
  if (!slug || slug.length < 3) {
    return { available: false, error: "Slug must be at least 3 characters" };
  }

  if (slug.length > 40) {
    return { available: false, error: "Slug must be 40 characters or less" };
  }

  if (!SLUG_PATTERN.test(slug)) {
    return {
      available: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    };
  }

  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, error: "This URL is reserved" };
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (data) {
    return { available: false, error: "This URL is already taken" };
  }

  return { available: true };
}

export async function createGroup(input: CreateGroupInput): Promise<CreateGroupResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  // Validate name
  const name = input.name.trim();
  if (!name || name.length < 2) {
    return { success: false, error: "Group name must be at least 2 characters" };
  }
  if (name.length > 50) {
    return { success: false, error: "Group name must be 50 characters or less" };
  }

  // Validate slug
  const slug = input.slug.trim().toLowerCase();
  const slugCheck = await checkSlugAvailability(slug);
  if (!slugCheck.available) {
    return { success: false, error: slugCheck.error ?? "Invalid URL" };
  }

  // Validate players
  const players = input.players
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Add organizer as a player if they opted in
  if (input.includeSelf) {
    const selfName = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "Me";
    if (!players.some((p) => p.toLowerCase() === selfName.toLowerCase())) {
      players.unshift(selfName);
    }
  }

  if (players.length < 2) {
    return { success: false, error: "Add at least 2 players to get started" };
  }
  if (players.length > 20) {
    return { success: false, error: "Maximum 20 players during setup" };
  }

  const supabase = getSupabase();

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, slug })
    .select("id")
    .single();

  if (groupError || !group) {
    return { success: false, error: "Failed to create group. Please try again." };
  }

  // Create players with auto-assigned colors
  const playerColors = [
    "#2D8B4E", "#2196F3", "#F5C518", "#FF6B35",
    "#9C27B0", "#E53935", "#00BCD4", "#4CAF50",
    "#FF9800", "#3F51B5", "#795548", "#607D8B",
    "#8BC34A", "#CDDC39", "#009688", "#673AB7",
    "#FFC107", "#03A9F4", "#FF5722", "#9E9E9E",
  ];

  const playerRecords = players.map((displayName, index) => ({
    group_id: group.id,
    display_name: displayName,
    color: playerColors[index % playerColors.length],
    is_active: true,
  }));

  const { error: playersError } = await supabase
    .from("players")
    .insert(playerRecords);

  if (playersError) {
    console.error("Failed to create starter players:", playersError.message);
  }

  return { success: true, slug };
}
