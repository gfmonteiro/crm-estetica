import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { whatsappSettingsRepository, whatsappLogRepository } from "@/lib/db/repositories/whatsapp";

let orgId: string;

beforeEach(async () => {
  const org = await organizationsRepository.create({
    nome: "Test Org",
    tipoNegocio: "Lash",
    email: "org@test.com",
    status: "ativo",
  });
  orgId = org.id;
});

describe("whatsappSettingsRepository", () => {
  it("retorna null quando não há settings", async () => {
    const settings = await whatsappSettingsRepository.get(orgId);
    expect(settings).toBeNull();
  });

  it("salva e busca settings (upsert)", async () => {
    const saved = await whatsappSettingsRepository.save(orgId, {
      phoneNumberId: "123456",
      accessToken: "token-secret-abc",
    });

    expect(saved.phoneNumberId).toBe("123456");
    expect(saved.updatedAt).toBeDefined();

    const found = await whatsappSettingsRepository.get(orgId);
    expect(found!.accessToken).toBe("token-secret-abc");
  });

  it("atualiza settings existentes (upsert)", async () => {
    await whatsappSettingsRepository.save(orgId, {
      phoneNumberId: "111",
      accessToken: "old-token",
    });

    const updated = await whatsappSettingsRepository.save(orgId, {
      phoneNumberId: "222",
      accessToken: "new-token",
    });

    expect(updated.phoneNumberId).toBe("222");
    expect(updated.accessToken).toBe("new-token");
  });
});

describe("whatsappLogRepository", () => {
  it("adiciona e lista entradas no log", async () => {
    await whatsappLogRepository.add(orgId, {
      ruleId: "rule-1",
      ruleName: "Lembrete 7 dias",
      clientId: "client-1",
      clientName: "Maria",
      appointmentId: "appt-1",
      mensagemEnviada: "Olá Maria!",
      status: "simulado",
      detalhe: "Sem credenciais",
    });

    await whatsappLogRepository.add(orgId, {
      ruleId: "rule-1",
      ruleName: "Lembrete 7 dias",
      clientId: "client-2",
      clientName: "Ana",
      appointmentId: "appt-2",
      mensagemEnviada: "Olá Ana!",
      status: "enviado",
    });

    const log = await whatsappLogRepository.findAll(orgId);
    expect(log.length).toBe(2);
    // Mais recente primeiro
    expect(log[0].clientName).toBe("Ana");
    expect(log[1].clientName).toBe("Maria");
    expect(log[1].detalhe).toBe("Sem credenciais");
  });
});
