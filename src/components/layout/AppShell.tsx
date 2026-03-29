import TopNav from '@/components/layout/TopNav';
import SideNav from '@/components/layout/SideNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <SideNav />
      <main className="xl:ml-72 pt-24 pb-12 px-8 min-h-screen">
        {children}
      </main>
    </>
  );
}
