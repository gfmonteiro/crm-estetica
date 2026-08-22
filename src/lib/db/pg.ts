import { Pool, type QueryResultRow } from "pg";

/**
 * Pool de conexões com o PostgreSQL. Substitui o "banco em arquivo JSON"
 * (src/lib/db/store.ts) — os repositórios em src/lib/db/repositories/*.ts
 * passam a chamar `query`/`queryOne` daqui em vez de
 * readCollection/writeCollection.
 *
 * Exige a variável de ambiente DATABASE_URL (veja .env.example).
 */

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Copie .env.example para .env e preencha a connection string do Postgres."
    );
  }
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

// Em dev, o Next.js recarrega módulos a cada request — guardamos o pool no
// global pra não abrir uma conexão nova toda hora.
export const pool = global.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
