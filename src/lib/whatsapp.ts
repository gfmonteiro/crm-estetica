import type { Client, Procedure } from "@/types";

/**
 * Coringas disponíveis para o usuário usar na mensagem. Cada um vira uma
 * chave em `WildcardContext`. Adicionar um novo coringa = adicionar aqui
 * + preencher o valor em `renderMessage`.
 */
export const AVAILABLE_WILDCARDS = [
  { token: "{{cliente}}", description: "Nome do cliente" },
  { token: "{{procedimento}}", description: "Nome do procedimento realizado" },
  { token: "{{profissional}}", description: "Profissional que atendeu" },
  { token: "{{dias}}", description: "Dias desde o atendimento" },
] as const;

interface WildcardContext {
  cliente: string;
  procedimento: string;
  profissional: string;
  dias: number;
}

export function renderMessage(template: string, ctx: WildcardContext): string {
  return template
    .replaceAll("{{cliente}}", ctx.cliente)
    .replaceAll("{{procedimento}}", ctx.procedimento)
    .replaceAll("{{profissional}}", ctx.profissional)
    .replaceAll("{{dias}}", String(ctx.dias));
}

export function buildWildcardContext(
  client: Client,
  procedure: Procedure | undefined,
  profissional: string,
  dias: number
): WildcardContext {
  return {
    cliente: client.nome.split(" ")[0], // primeiro nome, fica mais natural na mensagem
    procedimento: procedure?.nome ?? "seu procedimento",
    profissional,
    dias,
  };
}

interface SendResult {
  ok: boolean;
  detail: string;
}

/**
 * Envia mensagem via WhatsApp Cloud API (Graph API da Meta).
 *
 * IMPORTANTE — leia antes de usar em produção:
 * Este envio usa `type: "text"` (texto livre), que a Meta só entrega se
 * houver uma janela de atendimento ativa (o cliente falou com você nas
 * últimas 24h) — não é o caso de um lembrete automático "X dias depois".
 *
 * Para disparos proativos como este, troque o `body` abaixo por um envio
 * de TEMPLATE aprovado no Meta Business Manager, por exemplo:
 *
 * body: JSON.stringify({
 *   messaging_product: "whatsapp",
 *   to,
 *   type: "template",
 *   template: {
 *     name: "nome_do_seu_template_aprovado",
 *     language: { code: "pt_BR" },
 *     components: [{ type: "body", parameters: [{ type: "text", text: primeiroNome }] }],
 *   },
 * })
 *
 * O resto do fluxo (regras, agendamento do disparo, log) não muda.
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<SendResult> {
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(to),
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        detail: data?.error?.message || `Erro HTTP ${response.status}`,
      };
    }

    return { ok: true, detail: "Mensagem enviada com sucesso." };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

function normalizePhone(phone: string): string {
  // Remove tudo que não é dígito. A Cloud API espera formato internacional
  // (ex.: 55 11 999998888) sem símbolos.
  return phone.replace(/\D/g, "");
}
