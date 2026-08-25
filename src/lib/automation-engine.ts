import { appointmentsRepository } from "@/lib/db/repositories/appointments";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { proceduresRepository } from "@/lib/db/repositories/procedures";
import { automationRulesRepository } from "@/lib/db/repositories/automationRules";
import { whatsappSettingsRepository, whatsappLogRepository } from "@/lib/db/repositories/whatsapp";
import { renderMessage, buildWildcardContext, sendWhatsAppMessage } from "@/lib/whatsapp";
import type { WhatsAppLogEntry } from "@/types";

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcB - utcA) / msPerDay);
}

/**
 * Executa as regras ativas de UMA organização contra os atendimentos
 * concluídos ("compareceu"). Isolado por organizationId ? nunca mistura
 * regras/clientes de negócios diferentes.
 */
export async function runAutomationRules(organizationId: string): Promise<WhatsAppLogEntry[]> {
  const rules = await automationRulesRepository.findActive(organizationId);
  if (rules.length === 0) return [];

  const settings = await whatsappSettingsRepository.get(organizationId);
  const alreadySent = new Set(
    (await whatsappLogRepository.findAll(organizationId)).map((l) => `${l.ruleId}:${l.appointmentId}`)
  );

  const appointments = (await appointmentsRepository.findAll(organizationId))
    .filter((a) => a.status === "compareceu");
  const clients = await clientsRepository.findAll(organizationId);
  const procedures = await proceduresRepository.findAll(organizationId);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const procedureById = new Map(procedures.map((p) => [p.id, p]));

  const today = new Date();
  const results: WhatsAppLogEntry[] = [];

  for (const rule of rules) {
    for (const appointment of appointments) {
      const key = `${rule.id}:${appointment.id}`;
      if (alreadySent.has(key)) continue;

      const dias = daysBetween(new Date(appointment.startAt), today);
      if (dias !== rule.diasAposAtendimento) continue;

      const client = clientById.get(appointment.clientId);
      if (!client) continue;
      const procedure = procedureById.get(appointment.procedureId);

      const ctx = buildWildcardContext(client, procedure, appointment.profissional, dias);
      const mensagem = renderMessage(rule.mensagem, ctx);
      const to = client.whatsapp || client.telefone;

      let status: WhatsAppLogEntry["status"] = "simulado";
      let detalhe =
        "Sem credenciais do WhatsApp configuradas ? envio simulado (não enviado de verdade).";

      if (settings?.phoneNumberId && settings?.accessToken) {
        const result = await sendWhatsAppMessage(
          settings.phoneNumberId,
          settings.accessToken,
          to,
          mensagem
        );
        status = result.ok ? "enviado" : "erro";
        detalhe = result.detail;
      }

      const entry = await whatsappLogRepository.add(organizationId, {
        ruleId: rule.id,
        ruleName: rule.nome,
        clientId: client.id,
        clientName: client.nome,
        appointmentId: appointment.id,
        mensagemEnviada: mensagem,
        status,
        detalhe,
      });
      results.push(entry);
    }
  }

  return results;
}
