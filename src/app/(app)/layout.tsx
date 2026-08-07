import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "master") redirect("/master");
  if (!session.organizationId) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={session} />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-7">{children}</main>
    </div>
  );
}
