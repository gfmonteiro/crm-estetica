import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { usersRepository } from "@/lib/db/repositories/users";

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

describe("usersRepository", () => {
  it("cria um usuário admin e busca por email", async () => {
    const user = await usersRepository.create({
      nome: "Admin Teste",
      email: "admin@test.com",
      passwordHash: "$2a$10$fakehashhere",
      role: "admin",
      organizationId: orgId,
    });

    expect(user.id).toBeDefined();
    expect(user.role).toBe("admin");
    expect(user.organizationId).toBe(orgId);

    const found = await usersRepository.findByEmail("admin@test.com");
    expect(found).toBeDefined();
    expect(found!.nome).toBe("Admin Teste");
  });

  it("findByEmail é case-insensitive", async () => {
    await usersRepository.create({
      nome: "User",
      email: "User@Test.COM",
      passwordHash: "hash",
      role: "admin",
      organizationId: orgId,
    });

    const found = await usersRepository.findByEmail("user@test.com");
    expect(found).toBeDefined();
    expect(found!.nome).toBe("User");
  });

  it("cria um usuário master sem organização", async () => {
    const master = await usersRepository.create({
      nome: "Master",
      email: "master@plataforma.com",
      passwordHash: "hash",
      role: "master",
    });

    expect(master.organizationId).toBeUndefined();
    expect(master.role).toBe("master");
  });

  it("lista usuários de uma organização", async () => {
    await usersRepository.create({
      nome: "User A",
      email: "a@test.com",
      passwordHash: "hash",
      role: "profissional",
      organizationId: orgId,
    });
    await usersRepository.create({
      nome: "User B",
      email: "b@test.com",
      passwordHash: "hash",
      role: "admin",
      organizationId: orgId,
    });

    const users = await usersRepository.findByOrganization(orgId);
    expect(users.length).toBe(2);
  });

  it("findById retorna o usuário correto", async () => {
    const user = await usersRepository.create({
      nome: "Find Me",
      email: "find@test.com",
      passwordHash: "hash",
      role: "admin",
      organizationId: orgId,
    });

    const found = await usersRepository.findById(user.id);
    expect(found).toBeDefined();
    expect(found!.email).toBe("find@test.com");
  });
});
