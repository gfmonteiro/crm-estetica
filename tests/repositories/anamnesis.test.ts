import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";
import { anamnesisResponsesRepository, anamnesisTokenIndexRepository } from "@/lib/db/repositories/anamnesis";

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

describe("anamnesisFormsRepository", () => {
  it("cria uma ficha vazia", async () => {
    const form = await anamnesisFormsRepository.create(orgId, {
      nome: "Anamnese Lash",
      corFundo: "#FAF8FB",
    });

    expect(form.id).toBeDefined();
    expect(form.nome).toBe("Anamnese Lash");
    expect(form.ativo).toBe(true);
    expect(form.categorias).toEqual([]);
  });

  it("atualiza nome e cor", async () => {
    const form = await anamnesisFormsRepository.create(orgId, {
      nome: "Original",
      corFundo: "#FFF",
    });

    const updated = await anamnesisFormsRepository.update(orgId, form.id, {
      nome: "Atualizada",
      corFundo: "#000",
    });
    expect(updated!.nome).toBe("Atualizada");
    expect(updated!.corFundo).toBe("#000");
  });

  it("salva e recupera estrutura (categorias + perguntas)", async () => {
    const form = await anamnesisFormsRepository.create(orgId, {
      nome: "Ficha Completa",
      corFundo: "#FAF8FB",
    });

    const categorias = [
      {
        id: crypto.randomUUID(),
        nome: "Saúde Geral",
        ordem: 0,
        perguntas: [
          {
            id: crypto.randomUUID(),
            texto: "Possui alguma alergia?",
            tipo: "sim_nao" as const,
            obrigatoria: true,
            ordem: 0,
          },
          {
            id: crypto.randomUUID(),
            texto: "Quais medicamentos usa?",
            tipo: "texto_longo" as const,
            obrigatoria: false,
            ordem: 1,
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        nome: "Histórico",
        ordem: 1,
        perguntas: [
          {
            id: crypto.randomUUID(),
            texto: "Já fez extensão de cílios antes?",
            tipo: "unica_escolha" as const,
            opcoes: ["Sim", "Não"],
            obrigatoria: true,
            ordem: 0,
          },
        ],
      },
    ];

    const updated = await anamnesisFormsRepository.updateStructure(orgId, form.id, categorias);
    expect(updated!.categorias.length).toBe(2);
    expect(updated!.categorias[0].nome).toBe("Saúde Geral");
    expect(updated!.categorias[0].perguntas.length).toBe(2);
    expect(updated!.categorias[1].perguntas[0].opcoes).toEqual(["Sim", "Não"]);

    // Verifica que findById também retorna a estrutura completa
    const found = await anamnesisFormsRepository.findById(orgId, form.id);
    expect(found!.categorias.length).toBe(2);
    expect(found!.categorias[0].perguntas[0].texto).toBe("Possui alguma alergia?");
  });

  it("deleta uma ficha", async () => {
    const form = await anamnesisFormsRepository.create(orgId, {
      nome: "Deletar",
      corFundo: "#FFF",
    });

    const ok = await anamnesisFormsRepository.delete(orgId, form.id);
    expect(ok).toBe(true);

    const found = await anamnesisFormsRepository.findById(orgId, form.id);
    expect(found).toBeUndefined();
  });
});

describe("anamnesisResponsesRepository", () => {
  let formId: string;

  beforeEach(async () => {
    const form = await anamnesisFormsRepository.create(orgId, {
      nome: "Ficha Teste",
      corFundo: "#FAF8FB",
    });
    formId = form.id;
  });

  it("cria uma resposta com token único", async () => {
    const resp = await anamnesisResponsesRepository.create(orgId, {
      formId,
      respondenteNome: "Maria",
    });

    expect(resp.id).toBeDefined();
    expect(resp.token).toHaveLength(24);
    expect(resp.status).toBe("pendente");
    expect(resp.formId).toBe(formId);
  });

  it("resolve token via anamnesisTokenIndexRepository", async () => {
    const resp = await anamnesisResponsesRepository.create(orgId, { formId });

    const index = await anamnesisTokenIndexRepository.resolve(resp.token);
    expect(index).toBeDefined();
    expect(index!.organizationId).toBe(orgId);
    expect(index!.responseId).toBe(resp.id);
    expect(index!.formId).toBe(formId);
  });

  it("retorna undefined para token inexistente", async () => {
    const index = await anamnesisTokenIndexRepository.resolve("tokeninexistente123456");
    expect(index).toBeUndefined();
  });

  it("atualiza respostas e assinatura do cliente", async () => {
    const resp = await anamnesisResponsesRepository.create(orgId, { formId });

    const updated = await anamnesisResponsesRepository.update(orgId, resp.id, {
      respondenteNome: "Ana Paula",
      respostas: { "q1": "Sim", "q2": ["Opção A", "Opção B"] },
      assinaturaClienteDataUrl: "data:image/png;base64,ABC",
      assinaturaClienteEm: new Date().toISOString(),
      status: "assinada_cliente",
    });

    expect(updated!.status).toBe("assinada_cliente");
    expect(updated!.respondenteNome).toBe("Ana Paula");
    expect(updated!.respostas["q1"]).toBe("Sim");
    expect(updated!.respostas["q2"]).toEqual(["Opção A", "Opção B"]);
    expect(updated!.assinaturaClienteDataUrl).toContain("base64");
  });

  it("lista respostas por ficha", async () => {
    await anamnesisResponsesRepository.create(orgId, { formId });
    await anamnesisResponsesRepository.create(orgId, { formId });

    const byForm = await anamnesisResponsesRepository.findByForm(orgId, formId);
    expect(byForm.length).toBe(2);
  });
});
