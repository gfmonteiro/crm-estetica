import { NextResponse } from "next/server";
import { runAutomationRules } from "@/lib/automation-engine";
import { requireOrgSession } from "@/lib/session";

export async function POST() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const results = await runAutomationRules(session.organizationId);
  return NextResponse.json({ count: results.length, results });
}
