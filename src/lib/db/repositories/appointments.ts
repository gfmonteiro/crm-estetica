import { query, queryOne } from "../pg";
import type { Appointment } from "@/types";

interface AppointmentRow {
  id: string;
  organization_id: string;
  client_id: string;
  procedure_id: string;
  profissional: string;
  start_at: string;
  end_at: string;
  status: Appointment["status"];
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientId: row.client_id,
    procedureId: row.procedure_id,
    profissional: row.profissional,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    observacoes: row.observacoes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const appointmentsRepository = {
  async findAll(organizationId: string): Promise<Appointment[]> {
    const rows = await query<AppointmentRow>(
      "SELECT * FROM appointments WHERE organization_id = $1 ORDER BY start_at",
      [organizationId]
    );
    return rows.map(toAppointment);
  },

  async findById(organizationId: string, id: string): Promise<Appointment | undefined> {
    const row = await queryOne<AppointmentRow>(
      "SELECT * FROM appointments WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    return row ? toAppointment(row) : undefined;
  },

  async findByClient(organizationId: string, clientId: string): Promise<Appointment[]> {
    const rows = await query<AppointmentRow>(
      "SELECT * FROM appointments WHERE organization_id = $1 AND client_id = $2 ORDER BY start_at",
      [organizationId, clientId]
    );
    return rows.map(toAppointment);
  },

  async findByDateRange(organizationId: string, startISO: string, endISO: string): Promise<Appointment[]> {
    const rows = await query<AppointmentRow>(
      `SELECT * FROM appointments
       WHERE organization_id = $1 AND start_at >= $2 AND start_at <= $3
       ORDER BY start_at`,
      [organizationId, startISO, endISO]
    );
    return rows.map(toAppointment);
  },

  async create(
    organizationId: string,
    data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ): Promise<Appointment> {
    const row = await queryOne<AppointmentRow>(
      `INSERT INTO appointments
         (organization_id, client_id, procedure_id, profissional, start_at, end_at, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        organizationId,
        data.clientId,
        data.procedureId,
        data.profissional,
        data.startAt,
        data.endAt,
        data.status,
        data.observacoes ?? null,
      ]
    );
    return toAppointment(row!);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Appointment, "id" | "createdAt">>
  ): Promise<Appointment | undefined> {
    const current = await this.findById(organizationId, id);
    if (!current) return undefined;
    const merged = { ...current, ...data };
    const row = await queryOne<AppointmentRow>(
      `UPDATE appointments SET
         client_id = $1, procedure_id = $2, profissional = $3,
         start_at = $4, end_at = $5, status = $6, observacoes = $7
       WHERE organization_id = $8 AND id = $9
       RETURNING *`,
      [
        merged.clientId,
        merged.procedureId,
        merged.profissional,
        merged.startAt,
        merged.endAt,
        merged.status,
        merged.observacoes ?? null,
        organizationId,
        id,
      ]
    );
    return row ? toAppointment(row) : undefined;
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      "DELETE FROM appointments WHERE organization_id = $1 AND id = $2 RETURNING id",
      [organizationId, id]
    );
    return rows.length > 0;
  },
};
