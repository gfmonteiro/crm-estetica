import { query, queryOne } from "../pg";
import type { User } from "@/types";

// Uma linha da tabela `users` (snake_case, como vem do Postgres)
interface UserRow {
  id: string;
  nome: string;
  email: string;
  password_hash: string;
  role: User["role"];
  organization_id: string | null;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    organizationId: row.organization_id ?? undefined,
    createdAt: row.created_at,
  };
}

export const usersRepository = {
  async findAll(): Promise<User[]> {
    const rows = await query<UserRow>("SELECT * FROM users ORDER BY nome");
    return rows.map(toUser);
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const row = await queryOne<UserRow>(
      "SELECT * FROM users WHERE lower(email) = lower($1)",
      [email]
    );
    return row ? toUser(row) : undefined;
  },

  async findById(id: string): Promise<User | undefined> {
    const row = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return row ? toUser(row) : undefined;
  },

  async findByOrganization(organizationId: string): Promise<User[]> {
    const rows = await query<UserRow>(
      "SELECT * FROM users WHERE organization_id = $1 ORDER BY nome",
      [organizationId]
    );
    return rows.map(toUser);
  },

  async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const row = await queryOne<UserRow>(
      `INSERT INTO users (nome, email, password_hash, role, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.nome, data.email, data.passwordHash, data.role, data.organizationId ?? null]
    );
    return toUser(row!);
  },
};
