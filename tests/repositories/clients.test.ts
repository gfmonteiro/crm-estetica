import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { clientsRepository } from "@/lib/db/repositories/clients";

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

describe("clientsRepository", () => {
  it("cria e busca um cliente", async () => {
    const client = await clientsRepository.create(orgId, {
      nome: "Maria Silva",
      telefone: "11999998888",
      whatsapp: "11999998888",
      email: "maria@test.com",
      status: "ativo",
      tags: ["VIP"],
    });

    expect(client.id).toBeDefined();
    expect(client.nome).toBe("Maria Silva");
    expect(client.tags).toContain("VIP");

    const found = await clientsRepository.findById(orgId, client.id);
    expect(found).toBeDefined();
    expect(found!.email).toBe("maria@test.com");
  });

  it("lista clientes ordenados por nome", async () => {
    await clientsRepository.create(orgId, {
      nome: "Zélia",
      telefone: "11900000001",
      status: "ativo",
      tags: [],
    });
    await clientsRepository.create(orgId, {
      nome: "Ana",
      telefone: "11900000002",
      status: "ativo",
      tags: [],
    });

    const all = await clientsRepository.findAll(orgId);
    expect(all.length).toBe(2);
    expect(all[0].nome).toBe("Ana");
    expect(all[1].nome).toBe("Zélia");
  });

  it("soft delete não remove o cliente, apenas marca deletedAt", async () => {
    const client = await clientsRepository.create(orgId, {
      nome: "Para Excluir",
      telefone: "11900000003",
      status: "ativo",
      tags: [],
    });

    const ok = await clientsRepository.softDelete(orgId, client.id);
    expect(ok).toBe(true);

    // Não aparece no findAll (filtra deleted_at IS NULL)
    const all = await clientsRepository.findAll(orgId);
    expect(all.length).toBe(0);

    // Nem no findById
    const found = await clientsRepository.findById(orgId, client.id);
    expect(found).toBeUndefined();
  });

  it("atualiza campos do cliente", async () => {
    const client = await clientsRepository.create(orgId, {
      nome: "Antes",
      telefone: "11900000004",
      status: "ativo",
      tags: [],
    });

    const updated = await clientsRepository.update(orgId, client.id, {
      nome: "Depois",
      status: "bloqueado",
      tags: ["Inadimplente"],
    });

    expect(updated!.nome).toBe("Depois");
    expect(updated!.status).toBe("bloqueado");
    expect(updated!.tags).toContain("Inadimplente");
  });

  it("isola dados entre organizações", async () => {
    const org2 = await organizationsRepository.create({
      nome: "Outra Org",
      tipoNegocio: "Nail",
      email: "org2@test.com",
      status: "ativo",
    });

    await clientsRepository.create(orgId, {
      nome: "Cliente Org1",
      telefone: "11900000010",
      status: "ativo",
      tags: [],
    });
    await clientsRepository.create(org2.id, {
      nome: "Cliente Org2",
      telefone: "11900000011",
      status: "ativo",
      tags: [],
    });

    const clientsOrg1 = await clientsRepository.findAll(orgId);
    const clientsOrg2 = await clientsRepository.findAll(org2.id);

    expect(clientsOrg1.length).toBe(1);
    expect(clientsOrg1[0].nome).toBe("Cliente Org1");
    expect(clientsOrg2.length).toBe(1);
    expect(clientsOrg2[0].nome).toBe("Cliente Org2");
  });
});
