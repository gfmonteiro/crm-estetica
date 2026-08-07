import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/types";

/**
 * Para rotas de API do app do tenant (clientes, agenda, financeiro...).
 * Garante que existe sessão E que ela pertence a uma organização.
 * Usuário master não tem organizationId, então nunca passa aqui.
 */
export async function requireOrgSession(): Promise<
  (SessionUser & { organizationId: string }) | null
> {
  const session = await getSession();
  if (!session || !session.organizationId) return null;
  return session as SessionUser & { organizationId: string };
}

/**
 * Para rotas de API exclusivas da área Master (gestão de organizações).
 */
export async function requireMasterSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session || session.role !== "master") return null;
  return session;
}
