import { BottomNav, DesktopNav } from "@/components/navigation";

interface GroupLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{ slug: string }>;
}

export default async function GroupLayout({
  children,
  params,
}: GroupLayoutProps) {
  const { slug } = await params;

  return (
    <div className="flex min-h-dvh">
      <DesktopNav groupSlug={slug} />

      <main className="flex-1 md:ml-56 lg:ml-64 pb-20 md:pb-0">
        {/* Mobile top header */}
        <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b border-border bg-surface/95 backdrop-blur-sm md:hidden">
          <span className="text-lg font-bold text-court-green">PicklePal</span>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>

      <BottomNav groupSlug={slug} />
    </div>
  );
}
