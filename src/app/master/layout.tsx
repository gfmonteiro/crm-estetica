import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MasterTopbar } from "@/components/MasterTopbar";

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "master") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <MasterTopbar user={session} />
      <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
    </div>
  );
}
