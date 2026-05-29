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
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>

      <BottomNav groupSlug={slug} />
    </div>
  );
}
