import { query, queryOne } from "../pg";
import crypto from "crypto";

interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

function toToken(row: PasswordResetTokenRow): PasswordResetToken {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

export const passwordResetTokensRepository = {
  /**
   * Cria um token de redefinição de senha com validade de 1 hora.
   * Invalida tokens anteriores do mesmo usuário.
   */
  async create(userId: string): Promise<PasswordResetToken> {
    // Invalida tokens anteriores não utilizados
    await query(
      "UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
      [userId]
    );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const row = await queryOne<PasswordResetTokenRow>(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt.toISOString()]
    );

    return toToken(row!);
  },

  /**
   * Busca um token válido (não expirado e não utilizado).
   */
  async findValidToken(token: string): Promise<PasswordResetToken | undefined> {
    const row = await queryOne<PasswordResetTokenRow>(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1
         AND used_at IS NULL
         AND expires_at > now()`,
      [token]
    );
    return row ? toToken(row) : undefined;
  },

  /**
   * Marca o token como utilizado.
   */
  async markAsUsed(id: string): Promise<void> {
    await query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [id]);
  },
};
