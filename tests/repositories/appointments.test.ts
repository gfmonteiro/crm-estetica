import { describe, it, expect, beforeEach } from "vitest";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { proceduresRepository } from "@/lib/db/repositories/procedures";
import { appointmentsRepository } from "@/lib/db/repositories/appointments";

let orgId: string;
let clientId: string;
let procedureId: string;

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

  const procedure = await proceduresRepository.create(orgId, {
    nome: "Lash Lifting",
    valor: 150,
    tempoMedioMin: 60,
    comissaoPercentual: 30,
  });
  procedureId = procedure.id;
});

describe("appointmentsRepository", () => {
  it("cria e busca um agendamento", async () => {
    const appt = await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana Paula",
      startAt: "2025-06-15T10:00:00Z",
      endAt: "2025-06-15T11:00:00Z",
      status: "agendado",
    });

    expect(appt.id).toBeDefined();
    expect(appt.profissional).toBe("Ana Paula");
    expect(appt.status).toBe("agendado");

    const found = await appointmentsRepository.findById(orgId, appt.id);
    expect(found).toBeDefined();
    expect(found!.clientId).toBe(clientId);
  });

  it("busca agendamentos por cliente", async () => {
    await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana",
      startAt: "2025-06-15T10:00:00Z",
      endAt: "2025-06-15T11:00:00Z",
      status: "agendado",
    });
    await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana",
      startAt: "2025-06-16T10:00:00Z",
      endAt: "2025-06-16T11:00:00Z",
      status: "confirmado",
    });

    const byClient = await appointmentsRepository.findByClient(orgId, clientId);
    expect(byClient.length).toBe(2);
  });

  it("busca agendamentos por range de data", async () => {
    await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana",
      startAt: "2025-06-10T09:00:00Z",
      endAt: "2025-06-10T10:00:00Z",
      status: "compareceu",
    });
    await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana",
      startAt: "2025-06-20T09:00:00Z",
      endAt: "2025-06-20T10:00:00Z",
      status: "agendado",
    });

    const range = await appointmentsRepository.findByDateRange(
      orgId,
      "2025-06-09T00:00:00Z",
      "2025-06-11T23:59:59Z"
    );
    expect(range.length).toBe(1);
    expect(range[0].status).toBe("compareceu");
  });

  it("atualiza status do agendamento", async () => {
    const appt = await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana",
      startAt: "2025-06-15T10:00:00Z",
      endAt: "2025-06-15T11:00:00Z",
      status: "agendado",
    });

    const updated = await appointmentsRepository.update(orgId, appt.id, { status: "confirmado" });
    expect(updated!.status).toBe("confirmado");
  });

  it("deleta um agendamento", async () => {
    const appt = await appointmentsRepository.create(orgId, {
      clientId,
      procedureId,
      profissional: "Ana",
      startAt: "2025-06-15T10:00:00Z",
      endAt: "2025-06-15T11:00:00Z",
      status: "agendado",
    });

    const ok = await appointmentsRepository.delete(orgId, appt.id);
    expect(ok).toBe(true);

    const found = await appointmentsRepository.findById(orgId, appt.id);
    expect(found).toBeUndefined();
  });
});
