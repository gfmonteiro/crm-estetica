import { query, queryOne } from "../pg";
import type { WhatsAppSettings, WhatsAppLogEntry } from "@/types";

interface WhatsAppSettingsRow {
  organization_id: string;
  phone_number_id: string;
  access_token: string;
  updated_at: string;
}

function toSettings(row: WhatsAppSettingsRow): WhatsAppSettings {
  return {
    phoneNumberId: row.phone_number_id,
    accessToken: row.access_token,
    updatedAt: row.updated_at,
  };
}

interface WhatsAppLogRow {
  id: string;
  organization_id: string;
  rule_id: string | null;
  rule_name: string;
  client_id: string | null;
  client_name: string;
  appointment_id: string | null;
  mensagem_enviada: string;
  status: WhatsAppLogEntry["status"];
  detalhe: string | null;
  created_at: string;
}

function toLogEntry(row: WhatsAppLogRow): WhatsAppLogEntry {
  return {
    id: row.id,
    ruleId: row.rule_id ?? "",
    ruleName: row.rule_name,
    clientId: row.client_id ?? "",
    clientName: row.client_name,
    appointmentId: row.appointment_id ?? "",
    mensagemEnviada: row.mensagem_enviada,
    status: row.status,
    detalhe: row.detalhe ?? undefined,
    createdAt: row.created_at,
  };
}

export const whatsappSettingsRepository = {
  async get(organizationId: string): Promise<WhatsAppSettings | null> {
    const row = await queryOne<WhatsAppSettingsRow>(
      "SELECT * FROM whatsapp_settings WHERE organization_id = $1",
      [organizationId]
    );
    return row ? toSettings(row) : null;
  },

  async save(organizationId: string, data: Omit<WhatsAppSettings, "updatedAt">): Promise<WhatsAppSettings> {
    const row = await queryOne<WhatsAppSettingsRow>(
      `INSERT INTO whatsapp_settings (organization_id, phone_number_id, access_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id) DO UPDATE SET
         phone_number_id = EXCLUDED.phone_number_id,
         access_token = EXCLUDED.access_token,
         updated_at = now()
       RETURNING *`,
      [organizationId, data.phoneNumberId, data.accessToken]
    );
    return toSettings(row!);
  },
};

export const whatsappLogRepository = {
  async findAll(organizationId: string): Promise<WhatsAppLogEntry[]> {
    const rows = await query<WhatsAppLogRow>(
      `SELECT * FROM whatsapp_log
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 200`,
      [organizationId]
    );
    return rows.map(toLogEntry);
  },

  async add(organizationId: string, entry: Omit<WhatsAppLogEntry, "id" | "createdAt">): Promise<WhatsAppLogEntry> {
    const row = await queryOne<WhatsAppLogRow>(
      `INSERT INTO whatsapp_log
         (organization_id, rule_id, rule_name, client_id, client_name,
          appointment_id, mensagem_enviada, status, detalhe)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        organizationId,
        entry.ruleId || null,
        entry.ruleName,
        entry.clientId || null,
        entry.clientName,
        entry.appointmentId || null,
        entry.mensagemEnviada,
        entry.status,
        entry.detalhe ?? null,
      ]
    );
    return toLogEntry(row!);
  },
};
