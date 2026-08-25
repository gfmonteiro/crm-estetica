import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { proceduresRepository } from "@/lib/db/repositories/procedures";

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

describe("proceduresRepository", () => {
  it("cria e busca um procedimento", async () => {
    const proc = await proceduresRepository.create(orgId, {
      nome: "Volume Russo",
      valor: 280,
      tempoMedioMin: 120,
      comissaoPercentual: 40,
      descricao: "Extensão de cílios volume russo",
    });

    expect(proc.id).toBeDefined();
    expect(proc.valor).toBe(280);
    expect(proc.tempoMedioMin).toBe(120);
    expect(proc.comissaoPercentual).toBe(40);

    const found = await proceduresRepository.findById(orgId, proc.id);
    expect(found).toBeDefined();
    expect(found!.descricao).toBe("Extensão de cílios volume russo");
  });

  it("lista procedimentos ordenados por nome", async () => {
    await proceduresRepository.create(orgId, {
      nome: "Zita Lash",
      valor: 100,
      tempoMedioMin: 30,
      comissaoPercentual: 20,
    });
    await proceduresRepository.create(orgId, {
      nome: "Baby Lash",
      valor: 80,
      tempoMedioMin: 45,
      comissaoPercentual: 25,
    });

    const all = await proceduresRepository.findAll(orgId);
    expect(all.length).toBe(2);
    expect(all[0].nome).toBe("Baby Lash");
  });

  it("atualiza valor e comissão", async () => {
    const proc = await proceduresRepository.create(orgId, {
      nome: "Lifting",
      valor: 100,
      tempoMedioMin: 60,
      comissaoPercentual: 30,
    });

    const updated = await proceduresRepository.update(orgId, proc.id, {
      valor: 120,
      comissaoPercentual: 35,
    });
    expect(updated!.valor).toBe(120);
    expect(updated!.comissaoPercentual).toBe(35);
  });

  it("deleta um procedimento", async () => {
    const proc = await proceduresRepository.create(orgId, {
      nome: "Para Deletar",
      valor: 50,
      tempoMedioMin: 30,
      comissaoPercentual: 10,
    });

    const ok = await proceduresRepository.delete(orgId, proc.id);
    expect(ok).toBe(true);

    const all = await proceduresRepository.findAll(orgId);
    expect(all.length).toBe(0);
  });
});
