import { query, queryOne } from "../pg";
import type { Transaction } from "@/types";

interface TransactionRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  appointment_id: string | null;
  tipo: Transaction["tipo"];
  categoria: string;
  metodo_pagamento: Transaction["metodoPagamento"] | null;
  valor: string; // NUMERIC vem como string
  descricao: string | null;
  data: string;
  created_at: string;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    appointmentId: row.appointment_id ?? undefined,
    tipo: row.tipo,
    categoria: row.categoria,
    metodoPagamento: row.metodo_pagamento ?? undefined,
    valor: parseFloat(row.valor),
    descricao: row.descricao ?? undefined,
    data: row.data,
    createdAt: row.created_at,
  };
}

export const transactionsRepository = {
  async findAll(organizationId: string): Promise<Transaction[]> {
    const rows = await query<TransactionRow>(
      "SELECT * FROM transactions WHERE organization_id = $1 ORDER BY data DESC",
      [organizationId]
    );
    return rows.map(toTransaction);
  },

  async findById(organizationId: string, id: string): Promise<Transaction | undefined> {
    const row = await queryOne<TransactionRow>(
      "SELECT * FROM transactions WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    return row ? toTransaction(row) : undefined;
  },

  async findByClient(organizationId: string, clientId: string): Promise<Transaction[]> {
    const rows = await query<TransactionRow>(
      "SELECT * FROM transactions WHERE organization_id = $1 AND client_id = $2 ORDER BY data DESC",
      [organizationId, clientId]
    );
    return rows.map(toTransaction);
  },

  async create(organizationId: string, data: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const row = await queryOne<TransactionRow>(
      `INSERT INTO transactions
         (organization_id, client_id, appointment_id, tipo, categoria, metodo_pagamento, valor, descricao, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        organizationId,
        data.clientId ?? null,
        data.appointmentId ?? null,
        data.tipo,
        data.categoria,
        data.metodoPagamento ?? null,
        data.valor,
        data.descricao ?? null,
        data.data,
      ]
    );
    return toTransaction(row!);
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      "DELETE FROM transactions WHERE organization_id = $1 AND id = $2 RETURNING id",
      [organizationId, id]
    );
    return rows.length > 0;
  },
};
