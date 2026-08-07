import fs from "node:fs";
import path from "node:path";

/**
 * Camada de persistência simples baseada em arquivo JSON.
 *
 * Isso existe só para o MVP rodar localmente sem precisar de Postgres/Docker.
 * Cada arquivo <entidade>.json representa uma "tabela". A troca futura para
 * Postgres + Prisma (ver /docs/arquitetura) significa reimplementar só estas
 * funções de leitura/escrita — nada nas rotas ou na UI muda, porque tudo
 * acessa os dados através dos repositórios em `src/lib/db/repositories/*`.
 *
 * Multi-tenant: dados de cada organização (negócio cliente) ficam isolados
 * em `src/lib/data/orgs/<organizationId>/`. Dados globais da plataforma
 * (organizações cadastradas, usuários — inclusive o master) ficam direto em
 * `src/lib/data/`. Isso garante que uma organização nunca lê/escreve dado
 * de outra, mesmo sem um banco real com RLS.
 */

const DATA_DIR = path.join(process.cwd(), "src", "lib", "data");
const ORGS_DIR = path.join(DATA_DIR, "orgs");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function filePath(collection: string) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function orgFilePath(organizationId: string, collection: string) {
  return path.join(ORGS_DIR, organizationId, `${collection}.json`);
}

export function readCollection<T>(collection: string): T[] {
  ensureDir(DATA_DIR);
  const file = filePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]", "utf-8");
    return [];
  }
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeCollection<T>(collection: string, data: T[]): void {
  ensureDir(DATA_DIR);
  const file = filePath(collection);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, file); // escrita atômica
}

export function readObject<T>(name: string): T | null {
  ensureDir(DATA_DIR);
  const file = filePath(name);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeObject<T>(name: string, data: T): void {
  ensureDir(DATA_DIR);
  const file = filePath(name);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

// ---- Versões isoladas por organização (multi-tenant) ----

export function readOrgCollection<T>(organizationId: string, collection: string): T[] {
  const dir = path.join(ORGS_DIR, organizationId);
  ensureDir(dir);
  const file = orgFilePath(organizationId, collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]", "utf-8");
    return [];
  }
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeOrgCollection<T>(organizationId: string, collection: string, data: T[]): void {
  const dir = path.join(ORGS_DIR, organizationId);
  ensureDir(dir);
  const file = orgFilePath(organizationId, collection);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

export function readOrgObject<T>(organizationId: string, name: string): T | null {
  const dir = path.join(ORGS_DIR, organizationId);
  ensureDir(dir);
  const file = orgFilePath(organizationId, name);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeOrgObject<T>(organizationId: string, name: string, data: T): void {
  const dir = path.join(ORGS_DIR, organizationId);
  ensureDir(dir);
  const file = orgFilePath(organizationId, name);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

export function deleteOrgData(organizationId: string): void {
  const dir = path.join(ORGS_DIR, organizationId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}
