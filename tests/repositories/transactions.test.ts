import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { transactionsRepository } from "@/lib/db/repositories/transactions";

let orgId: string;
let clientId: string;

beforeEach(async () => {
  const org = await organizationsRepository.create({
    nome: "Test Org",
    tipoNegocio: "Lash",
    email: "org@test.com",
    status: "ativo",
  });
  orgId = org.id;

  const client = await clientsRepository.create(orgId, {
    nome: "Cliente Teste",
    telefone: "11999990000",
    status: "ativo",
    tags: [],
  });
  clientId = client.id;
});

describe("transactionsRepository", () => {
  it("cria uma receita e busca", async () => {
    const tx = await transactionsRepository.create(orgId, {
      clientId,
      tipo: "receita",
      categoria: "Procedimento",
      metodoPagamento: "pix",
      valor: 200,
      descricao: "Lash Lifting",
      data: "2025-06-15",
    });

    expect(tx.id).toBeDefined();
    expect(tx.tipo).toBe("receita");
    expect(tx.valor).toBe(200);
    expect(tx.metodoPagamento).toBe("pix");

    const found = await transactionsRepository.findById(orgId, tx.id);
    expect(found).toBeDefined();
    expect(found!.clientId).toBe(clientId);
  });

  it("lista transações ordenadas por data desc", async () => {
    await transactionsRepository.create(orgId, {
      tipo: "receita",
      categoria: "Procedimento",
      valor: 100,
      data: "2025-06-10",
    });
    await transactionsRepository.create(orgId, {
      tipo: "despesa",
      categoria: "Material",
      valor: 50,
      data: "2025-06-15",
    });

    const all = await transactionsRepository.findAll(orgId);
    expect(all.length).toBe(2);
    // Mais recente primeiro
    expect(all[0].data).toContain("2025-06-15");
    expect(all[1].data).toContain("2025-06-10");
  });

  it("busca transações por cliente", async () => {
    await transactionsRepository.create(orgId, {
      clientId,
      tipo: "receita",
      categoria: "Procedimento",
      valor: 150,
      data: "2025-06-12",
    });
    await transactionsRepository.create(orgId, {
      tipo: "despesa",
      categoria: "Aluguel",
      valor: 2000,
      data: "2025-06-01",
    });

    const byClient = await transactionsRepository.findByClient(orgId, clientId);
    expect(byClient.length).toBe(1);
    expect(byClient[0].categoria).toBe("Procedimento");
  });

  it("deleta uma transação", async () => {
    const tx = await transactionsRepository.create(orgId, {
      tipo: "despesa",
      categoria: "Material",
      valor: 30,
      data: "2025-06-01",
    });

    const ok = await transactionsRepository.delete(orgId, tx.id);
    expect(ok).toBe(true);

    const all = await transactionsRepository.findAll(orgId);
    expect(all.length).toBe(0);
  });
});
