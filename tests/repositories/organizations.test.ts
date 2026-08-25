import { describe, it, expect } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";

describe("organizationsRepository", () => {
  it("cria e busca uma organização", async () => {
    const org = await organizationsRepository.create({
      nome: "Studio Lash Test",
      tipoNegocio: "Lash Designer",
      email: "test@studio.com",
      telefone: "11999990000",
      status: "ativo",
    });

    expect(org.id).toBeDefined();
    expect(org.nome).toBe("Studio Lash Test");
    expect(org.status).toBe("ativo");

    const found = await organizationsRepository.findById(org.id);
    expect(found).toBeDefined();
    expect(found!.email).toBe("test@studio.com");
  });

  it("lista todas as organizações", async () => {
    await organizationsRepository.create({
      nome: "Org A",
      tipoNegocio: "Clínica",
      email: "a@test.com",
      status: "ativo",
    });
    await organizationsRepository.create({
      nome: "Org B",
      tipoNegocio: "Nail Designer",
      email: "b@test.com",
      status: "ativo",
    });

    const all = await organizationsRepository.findAll();
    expect(all.length).toBe(2);
  });

  it("atualiza uma organização", async () => {
    const org = await organizationsRepository.create({
      nome: "Original",
      tipoNegocio: "Lash",
      email: "orig@test.com",
      status: "ativo",
    });

    const updated = await organizationsRepository.update(org.id, { nome: "Atualizado", status: "suspenso" });
    expect(updated!.nome).toBe("Atualizado");
    expect(updated!.status).toBe("suspenso");
  });

  it("deleta uma organização", async () => {
    const org = await organizationsRepository.create({
      nome: "Para Deletar",
      tipoNegocio: "Test",
      email: "del@test.com",
      status: "ativo",
    });

    const ok = await organizationsRepository.delete(org.id);
    expect(ok).toBe(true);

    const found = await organizationsRepository.findById(org.id);
    expect(found).toBeUndefined();
  });
});
