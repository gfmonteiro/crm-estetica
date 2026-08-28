import { describe, it, expect } from "vitest";
import { renderMessage, buildWildcardContext } from "@/lib/whatsapp";
import type { Client, Procedure } from "@/types";

describe("renderMessage", () => {
  it("substitui todos os coringas", () => {
    const template = "Olá {{cliente}}! Seu {{procedimento}} com {{profissional}} foi há {{dias}} dias.";
    const ctx = {
      cliente: "Maria",
      procedimento: "Volume Russo",
      profissional: "Ana",
      dias: 7,
    };

    const result = renderMessage(template, ctx);
    expect(result).toBe("Olá Maria! Seu Volume Russo com Ana foi há 7 dias.");
  });

  it("mantém texto sem coringas inalterado", () => {
    const template = "Mensagem simples sem variáveis";
    const ctx = { cliente: "X", procedimento: "Y", profissional: "Z", dias: 1 };

    expect(renderMessage(template, ctx)).toBe("Mensagem simples sem variáveis");
  });

  it("substitui múltiplas ocorrências do mesmo coringa", () => {
    const template = "{{cliente}}, olá {{cliente}}!";
    const ctx = { cliente: "Ana", procedimento: "", profissional: "", dias: 0 };

    expect(renderMessage(template, ctx)).toBe("Ana, olá Ana!");
  });
});

describe("buildWildcardContext", () => {
  const mockClient: Client = {
    id: "1",
    nome: "Maria Silva",
    telefone: "11999990000",
    status: "ativo",
    tags: [],
    createdAt: "",
    updatedAt: "",
  };

  const mockProcedure: Procedure = {
    id: "1",
    nome: "Lash Lifting",
    valor: 150,
    tempoMedioMin: 60,
    comissaoPercentual: 30,
    createdAt: "",
    updatedAt: "",
  };

  it("usa apenas o primeiro nome do cliente", () => {
    const ctx = buildWildcardContext(mockClient, mockProcedure, "Ana Paula", 7);
    expect(ctx.cliente).toBe("Maria");
  });

  it("usa nome do procedimento quando disponível", () => {
    const ctx = buildWildcardContext(mockClient, mockProcedure, "Ana", 5);
    expect(ctx.procedimento).toBe("Lash Lifting");
  });

  it("usa fallback quando procedure é undefined", () => {
    const ctx = buildWildcardContext(mockClient, undefined, "Ana", 3);
    expect(ctx.procedimento).toBe("seu procedimento");
  });

  it("preenche profissional e dias corretamente", () => {
    const ctx = buildWildcardContext(mockClient, mockProcedure, "Carla", 14);
    expect(ctx.profissional).toBe("Carla");
    expect(ctx.dias).toBe(14);
  });
});
