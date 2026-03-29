import TopNav from '@/components/layout/TopNav';
import SideNav from '@/components/layout/SideNav';
import { getSession } from '@/lib/auth';

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const user = session
    ? { name: session.name, role: session.role, email: session.email }
    : null;

  return (
    <>
      <TopNav user={user} />
      <SideNav />
      <main className="xl:ml-72 pt-24 pb-12 px-8 min-h-screen">
        {children}
      </main>
    </>
  );
}
