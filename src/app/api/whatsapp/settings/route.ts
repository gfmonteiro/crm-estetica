import { NextResponse } from "next/server";
import { z } from "zod";
import { whatsappSettingsRepository } from "@/lib/db/repositories/whatsapp";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  phoneNumberId: z.string(),
  accessToken: z.string(),
});

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const settings = await whatsappSettingsRepository.get(session.organizationId);
  if (!settings) return NextResponse.json(null);
  return NextResponse.json({
    phoneNumberId: settings.phoneNumberId,
    accessTokenPreview: settings.accessToken ? maskToken(settings.accessToken) : "",
    hasAccessToken: Boolean(settings.accessToken),
    updatedAt: settings.updatedAt,
  });
}

export async function PUT(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const current = await whatsappSettingsRepository.get(session.organizationId);
  const accessToken = parsed.data.accessToken || current?.accessToken || "";

  const saved = await whatsappSettingsRepository.save(session.organizationId, {
    phoneNumberId: parsed.data.phoneNumberId,
    accessToken,
  });
  return NextResponse.json({
    phoneNumberId: saved.phoneNumberId,
    accessTokenPreview: maskToken(saved.accessToken),
    hasAccessToken: Boolean(saved.accessToken),
    updatedAt: saved.updatedAt,
  });
}

function maskToken(token: string): string {
  if (token.length <= 8) return "????????";
  return `${token.slice(0, 4)}????????${token.slice(-4)}`;
}
