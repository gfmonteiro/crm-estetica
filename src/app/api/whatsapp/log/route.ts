import { NextResponse } from "next/server";
import { whatsappLogRepository } from "@/lib/db/repositories/whatsapp";
import { requireOrgSession } from "@/lib/session";

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(await whatsappLogRepository.findAll(session.organizationId));
}
