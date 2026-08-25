import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";
import type { SessionUser } from "@/types";

describe("hashPassword / verifyPassword", () => {
  it("gera hash e verifica corretamente", async () => {
    const plain = "minhasenha123";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);

    const valid = await verifyPassword(plain, hash);
    expect(valid).toBe(true);
  });

  it("rejeita senha incorreta", async () => {
    const hash = await hashPassword("correta");
    const valid = await verifyPassword("errada", hash);
    expect(valid).toBe(false);
  });
});

describe("createSessionToken / verifySessionToken", () => {
  const user: SessionUser = {
    id: "user-1",
    nome: "Teste",
    email: "teste@test.com",
    role: "admin",
    organizationId: "org-1",
    organizationName: "Studio Test",
  };

  it("cria token e decodifica corretamente", () => {
    const token = createSessionToken(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe("user-1");
    expect(decoded!.email).toBe("teste@test.com");
    expect(decoded!.role).toBe("admin");
    expect(decoded!.organizationId).toBe("org-1");
  });

  it("retorna null para token inválido", () => {
    const decoded = verifySessionToken("token-invalido-aqui");
    expect(decoded).toBeNull();
  });

  it("retorna null para token vazio", () => {
    const decoded = verifySessionToken("");
    expect(decoded).toBeNull();
  });
});
