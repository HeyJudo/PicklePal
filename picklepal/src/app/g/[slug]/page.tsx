import { notFound } from "next/navigation";
import { createServerClient, type Group } from "@/lib/supabase";

interface HomePageProps {
  readonly params: Promise<{ slug: string }>;
}

async function getGroup(slug: string): Promise<Group | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();

  return data;
}

export default async function HomePage({ params }: HomePageProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Home</h1>
        <p className="text-text-secondary mt-1">
          Welcome to {group.name} dashboard.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          Session summaries, quick actions, and recent activity will appear
          here.
        </p>
      </div>
    </div>
  );
}
