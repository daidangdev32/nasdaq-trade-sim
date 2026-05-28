import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Header } from "@/components/dashboard/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header email={user.email ?? null} />
        <main className="flex-1 px-4 lg:px-6 py-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
