import { currentUser } from "@clerk/nextjs/server";
import { BottomNav, DesktopNav } from "@/components/navigation";
import { canViewGroup } from "@/lib/privacy";
import { PrivateGroupGate } from "./PrivateGroupGate";

interface GroupLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{ slug: string }>;
}

export default async function GroupLayout({
  children,
  params,
}: GroupLayoutProps) {
  const { slug } = await params;

  // Check privacy access
  const user = await currentUser();
  const access = await canViewGroup(slug, user?.id ?? null);

  if (!access.canView) {
    return <PrivateGroupGate reason={access.reason} />;
  }

  return (
    <div className="flex min-h-dvh">
      <DesktopNav groupSlug={slug} />

      <main className="flex-1 md:ml-56 lg:ml-64 pb-20 md:pb-0">
        {/* Mobile top header */}
        <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b border-border bg-surface/95 backdrop-blur-sm md:hidden">
          <span className="text-lg font-bold text-court-green">PicklePal</span>
        </header>

        <div className="px-4 py-6 lg:px-8">{children}</div>
      </main>

      <BottomNav groupSlug={slug} />
    </div>
  );
}
