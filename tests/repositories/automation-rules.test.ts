import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { automationRulesRepository } from "@/lib/db/repositories/automationRules";

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

describe("automationRulesRepository", () => {
  it("cria e busca uma regra", async () => {
    const rule = await automationRulesRepository.create(orgId, {
      nome: "Lembrete 7 dias",
      diasAposAtendimento: 7,
      mensagem: "Olá {{cliente}}, como estão seus cílios?",
      ativo: true,
    });

    expect(rule.id).toBeDefined();
    expect(rule.nome).toBe("Lembrete 7 dias");
    expect(rule.diasAposAtendimento).toBe(7);
    expect(rule.ativo).toBe(true);

    const found = await automationRulesRepository.findById(orgId, rule.id);
    expect(found).toBeDefined();
    expect(found!.mensagem).toContain("{{cliente}}");
  });

  it("lista regras ordenadas por diasAposAtendimento", async () => {
    await automationRulesRepository.create(orgId, {
      nome: "30 dias",
      diasAposAtendimento: 30,
      mensagem: "Retorno?",
      ativo: true,
    });
    await automationRulesRepository.create(orgId, {
      nome: "7 dias",
      diasAposAtendimento: 7,
      mensagem: "Como está?",
      ativo: true,
    });

    const all = await automationRulesRepository.findAll(orgId);
    expect(all[0].diasAposAtendimento).toBe(7);
    expect(all[1].diasAposAtendimento).toBe(30);
  });

  it("findActive retorna apenas regras ativas", async () => {
    await automationRulesRepository.create(orgId, {
      nome: "Ativa",
      diasAposAtendimento: 7,
      mensagem: "Msg",
      ativo: true,
    });
    await automationRulesRepository.create(orgId, {
      nome: "Inativa",
      diasAposAtendimento: 14,
      mensagem: "Msg",
      ativo: false,
    });

    const active = await automationRulesRepository.findActive(orgId);
    expect(active.length).toBe(1);
    expect(active[0].nome).toBe("Ativa");
  });

  it("atualiza uma regra", async () => {
    const rule = await automationRulesRepository.create(orgId, {
      nome: "Original",
      diasAposAtendimento: 7,
      mensagem: "Msg",
      ativo: true,
    });

    const updated = await automationRulesRepository.update(orgId, rule.id, {
      ativo: false,
      mensagem: "Nova mensagem",
    });
    expect(updated!.ativo).toBe(false);
    expect(updated!.mensagem).toBe("Nova mensagem");
  });

  it("deleta uma regra", async () => {
    const rule = await automationRulesRepository.create(orgId, {
      nome: "Deletar",
      diasAposAtendimento: 3,
      mensagem: "Msg",
      ativo: true,
    });

    const ok = await automationRulesRepository.delete(orgId, rule.id);
    expect(ok).toBe(true);

    const all = await automationRulesRepository.findAll(orgId);
    expect(all.length).toBe(0);
  });
});
