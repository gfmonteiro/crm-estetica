import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { leadsRepository, leadActivitiesRepository } from "@/lib/db/repositories/leads";

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

describe("leadsRepository", () => {
  it("cria e busca um lead", async () => {
    const lead = await leadsRepository.create(orgId, {
      nome: "Juliana Oliveira",
      telefone: "11999997777",
      email: "juliana@test.com",
      origem: "Instagram",
      procedureInteresse: "Volume Russo",
      valorEstimado: 300,
      stage: "novo_lead",
    });

    expect(lead.id).toBeDefined();
    expect(lead.nome).toBe("Juliana Oliveira");
    expect(lead.stage).toBe("novo_lead");
    expect(lead.valorEstimado).toBe(300);

    const found = await leadsRepository.findById(orgId, lead.id);
    expect(found).toBeDefined();
    expect(found!.origem).toBe("Instagram");
  });

  it("atualiza o stage do lead", async () => {
    const lead = await leadsRepository.create(orgId, {
      nome: "Lead Teste",
      telefone: "11900000001",
      stage: "novo_lead",
    });

    const updated = await leadsRepository.update(orgId, lead.id, { stage: "contato" });
    expect(updated!.stage).toBe("contato");
  });

  it("deleta um lead", async () => {
    const lead = await leadsRepository.create(orgId, {
      nome: "Para Deletar",
      telefone: "11900000002",
      stage: "novo_lead",
    });

    const ok = await leadsRepository.delete(orgId, lead.id);
    expect(ok).toBe(true);

    const found = await leadsRepository.findById(orgId, lead.id);
    expect(found).toBeUndefined();
  });
});

describe("leadActivitiesRepository", () => {
  it("adiciona e lista atividades de um lead", async () => {
    const lead = await leadsRepository.create(orgId, {
      nome: "Lead Ativo",
      telefone: "11900000003",
      stage: "contato",
    });

    await leadActivitiesRepository.add(orgId, lead.id, "Primeiro contato realizado");
    await leadActivitiesRepository.add(orgId, lead.id, "Orçamento enviado");

    const activities = await leadActivitiesRepository.findByLead(orgId, lead.id);
    expect(activities.length).toBe(2);
    // Mais recente primeiro
    expect(activities[0].descricao).toBe("Orçamento enviado");
    expect(activities[1].descricao).toBe("Primeiro contato realizado");
  });
});
