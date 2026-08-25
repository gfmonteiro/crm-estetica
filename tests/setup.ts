import { pool } from "@/lib/db/pg";
import { afterAll, beforeAll, beforeEach } from "vitest";

/**
 * Setup global dos testes de integração.
 *
 * Requisitos:
 * - Banco PostgreSQL rodando (pode ser o mesmo de dev ou um separado).
 * - DATABASE_URL definida (via .env ou .env.test).
 * - Schemas aplicados (schema.sql + anamnese_schema.sql).
 *
 * Antes de cada teste, limpa todas as tabelas (TRUNCATE CASCADE) para
 * garantir isolamento entre testes sem precisar recriar o schema inteiro.
 */

// Carrega variáveis de ambiente de .env.test (se existir) ou .env
import "dotenv/config";

const TABLES_TO_TRUNCATE = [
  "whatsapp_log",
  "whatsapp_settings",
  "automation_rules",
  "anamnesis_responses",
  "anamnesis_questions",
  "anamnesis_categories",
  "anamnesis_forms",
  "lead_activities",
  "leads",
  "transactions",
  "appointments",
  "procedures",
  "clients",
  "users",
  "organizations",
];

beforeAll(async () => {
  // Garante que o banco está acessível
  await pool.query("SELECT 1");
});

beforeEach(async () => {
  // Limpa todas as tabelas em ordem para respeitar FKs
  await pool.query(
    `TRUNCATE ${TABLES_TO_TRUNCATE.join(", ")} CASCADE`
  );
});

afterAll(async () => {
  await pool.end();
});
