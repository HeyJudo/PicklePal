import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isGroupAdmin } from "@/lib/membership";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { InviteManager } from "./InviteManager";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get group
  const supabase = getSupabase();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) {
    redirect(`/g/${slug}`);
  }

  // Check admin access
  const isAdmin = await isGroupAdmin(user.id, group.id);
  if (!isAdmin) {
    redirect(`/g/${slug}`);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href={`/g/${slug}`}
            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-on-surface-variant" />
            <h1 className="font-headline text-base font-semibold text-on-background">
              Group Settings
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        {/* Group info */}
        <section>
          <h2 className="font-headline text-lg font-bold text-on-background">
            {group.name}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your group settings, admins, and privacy.
          </p>
        </section>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Admin Invites */}
        <InviteManager slug={slug} />
      </div>
    </main>
  );
}
