import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/dashboard";
import { requireOrgSession } from "@/lib/session";

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(await getDashboardStats(session.organizationId));
}
