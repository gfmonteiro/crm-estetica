/**
 * Migra os dados que hoje estão em src/lib/data/organizations.json e
 * src/lib/data/users.json para o Postgres — preservando IDs, hash de
 * senha (bcrypt é portável, não precisa recriar senha de ninguém) e
 * datas de criação.
 *
 * Rodar com: npm run migrate:users
 *
 * Pré-requisito: já ter rodado schema.sql no banco de destino, e o
 * DATABASE_URL no .env apontando pra ele.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "../src/lib/db/pg";

const DATA_DIR = path.join(process.cwd(), "src", "lib", "data");

function readJson<T>(file: string): T[] {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`(arquivo ${file} não existe, pulando)`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

interface OrgJson {
  id: string;
  nome: string;
  tipoNegocio: string;
  email: string;
  telefone?: string;
  status: string;
  plano?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserJson {
  id: string;
  nome: string;
  email: string;
  passwordHash: string;
  role: string;
  organizationId?: string;
  createdAt: string;
}

async function main() {
  const orgs = readJson<OrgJson>("organizations.json");
  const users = readJson<UserJson>("users.json");

  console.log(`Migrando ${orgs.length} organização(ões)...`);
  for (const org of orgs) {
    await pool.query(
      `INSERT INTO organizations (id, nome, tipo_negocio, email, telefone, status, plano, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        org.id,
        org.nome,
        org.tipoNegocio,
        org.email,
        org.telefone ?? null,
        org.status,
        org.plano ?? null,
        org.createdAt,
        org.updatedAt,
      ]
    );
    console.log(`  ✓ ${org.nome}`);
  }

  console.log(`\nMigrando ${users.length} usuário(s)...`);
  for (const user of users) {
    await pool.query(
      `INSERT INTO users (id, nome, email, password_hash, role, organization_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.nome,
        user.email,
        user.passwordHash,
        user.role,
        user.organizationId ?? null,
        user.createdAt,
      ]
    );
    console.log(`  ✓ ${user.email} (${user.role})`);
  }

  console.log("\nMigração de usuários/organizações concluída!");
  await pool.end();
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
