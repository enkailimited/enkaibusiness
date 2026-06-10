import { Sidebar, platformNavItems } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar items={platformNavItems} />
      <main className="pb-16 md:pl-64 md:pb-0">
        <div className="container py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
