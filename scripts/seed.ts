/**
 * Popula o banco (arquivos JSON) com:
 * - 1 usuário master (dono da plataforma)
 * - 1 organização de demonstração + 1 usuário admin dela
 * - dados de exemplo isolados dentro dessa organização
 *
 * Rodar com: npm run seed
 */
import bcrypt from "bcryptjs";
import { writeCollection, writeOrgCollection } from "../src/lib/db/store";
import type {
  Client,
  Procedure,
  Appointment,
  Transaction,
  User,
  Organization,
  AutomationRule,
  Lead,
} from "../src/types";

function id() {
  return crypto.randomUUID();
}

async function main() {
  const now = new Date().toISOString();

  // ---- Plataforma: usuário master ----
  const masterPasswordHash = await bcrypt.hash("master1234", 10);

  // ---- Organização de demonstração ----
  const org: Organization = {
    id: id(),
    nome: "Studio Beatriz Lash Design",
    tipoNegocio: "Lash Designer",
    email: "contato@studiobeatriz.com",
    telefone: "11999990000",
    status: "ativo",
    plano: "Starter",
    createdAt: now,
    updatedAt: now,
  };
  writeCollection<Organization>("organizations", [org]);

  // ---- Usuário admin da organização de demonstração ----
  const tenantPasswordHash = await bcrypt.hash("demo1234", 10);

  const users: User[] = [
    {
      id: id(),
      nome: "Studio Master",
      email: "master@studio.com",
      passwordHash: masterPasswordHash,
      role: "master",
      createdAt: now,
    },
    {
      id: id(),
      nome: "Ana Studio",
      email: "demo@studio.com",
      passwordHash: tenantPasswordHash,
      role: "admin",
      organizationId: org.id,
      createdAt: now,
    },
  ];
  writeCollection("users", users);

  const orgId = org.id;

  // ---- Procedimentos (isolados na organização demo) ----
  const procedures: Procedure[] = [
    {
      id: id(),
      nome: "Volume Brasileiro",
      valor: 180,
      tempoMedioMin: 120,
      comissaoPercentual: 30,
      descricao: "Extensão de cílios volume brasileiro, efeito natural com volume.",
      materiais: "Fios 0.07mm, cola profissional",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      nome: "Volume Russo",
      valor: 220,
      tempoMedioMin: 150,
      comissaoPercentual: 30,
      descricao: "Efeito volumoso e dramático com fios finos.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      nome: "Design de Sobrancelhas",
      valor: 60,
      tempoMedioMin: 40,
      comissaoPercentual: 25,
      descricao: "Design com henna e alinhamento.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      nome: "Lash Lifting",
      valor: 120,
      tempoMedioMin: 60,
      comissaoPercentual: 25,
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeOrgCollection(orgId, "procedures", procedures);

  // ---- Clientes ----
  const clients: Client[] = [
    {
      id: id(),
      nome: "Beatriz Almeida",
      telefone: "11988887777",
      whatsapp: "11988887777",
      email: "beatriz@email.com",
      dataNascimento: "1994-08-15",
      sexo: "Feminino",
      cidade: "São Paulo",
      estado: "SP",
      origem: "Instagram",
      status: "ativo",
      tags: ["VIP", "Cliente recorrente"],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: id(),
      nome: "Carla Souza",
      telefone: "11977776666",
      whatsapp: "11977776666",
      email: "carla@email.com",
      dataNascimento: "1998-08-20",
      cidade: "Garça",
      estado: "SP",
      origem: "Indicação",
      status: "ativo",
      tags: ["Primeira visita"],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: id(),
      nome: "Fernanda Lima",
      telefone: "11966665555",
      whatsapp: "11966665555",
      origem: "TikTok",
      status: "ativo",
      tags: ["Influencer"],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];
  writeOrgCollection(orgId, "clients", clients);

  // ---- Agendamentos ----
  const today = new Date();
  function at(hour: number, minute: number, dayOffset = 0) {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  const appointments: Appointment[] = [
    {
      id: id(),
      clientId: clients[0].id,
      procedureId: procedures[0].id,
      profissional: "Ana Studio",
      startAt: at(10, 0),
      endAt: at(12, 0),
      status: "confirmado",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      clientId: clients[1].id,
      procedureId: procedures[2].id,
      profissional: "Ana Studio",
      startAt: at(14, 30),
      endAt: at(15, 10),
      status: "agendado",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      clientId: clients[2].id,
      procedureId: procedures[1].id,
      profissional: "Ana Studio",
      startAt: at(11, 0, 2),
      endAt: at(13, 30, 2),
      status: "agendado",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      clientId: clients[0].id,
      procedureId: procedures[3].id,
      profissional: "Ana Studio",
      startAt: at(9, 0, -7),
      endAt: at(10, 0, -7),
      status: "compareceu",
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeOrgCollection(orgId, "appointments", appointments);

  // ---- Financeiro ----
  const transactions: Transaction[] = [
    {
      id: id(),
      clientId: clients[0].id,
      tipo: "receita",
      categoria: "Procedimento",
      metodoPagamento: "pix",
      valor: 180,
      descricao: "Volume Brasileiro",
      data: at(9, 0, -7).slice(0, 10),
      createdAt: now,
    },
    {
      id: id(),
      tipo: "despesa",
      categoria: "Materiais e insumos",
      valor: 320,
      descricao: "Compra de fios e cola",
      data: today.toISOString().slice(0, 10),
      createdAt: now,
    },
  ];
  writeOrgCollection(orgId, "transactions", transactions);

  // ---- WhatsApp: regra de automação de exemplo ----
  const automationRules: AutomationRule[] = [
    {
      id: id(),
      nome: "Retorno pós-procedimento",
      diasAposAtendimento: 15,
      mensagem:
        "Oi {{cliente}}! Já faz {{dias}} dias do seu {{procedimento}} com {{profissional}} 💛 Passando pra saber como está o resultado — vamos agendar sua manutenção?",
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeOrgCollection(orgId, "automation_rules", automationRules);
  writeOrgCollection(orgId, "whatsapp_log", []);

  // ---- Pipeline: leads de exemplo ----
  const leads: Lead[] = [
    {
      id: id(),
      nome: "Juliana Ferreira",
      telefone: "11955554444",
      origem: "Instagram",
      procedureInteresse: "Volume Russo",
      valorEstimado: 220,
      stage: "novo_lead",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      nome: "Patrícia Gomes",
      telefone: "11944443333",
      origem: "Indicação",
      procedureInteresse: "Design de Sobrancelhas",
      valorEstimado: 60,
      stage: "contato",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: id(),
      nome: "Renata Costa",
      telefone: "11933332222",
      origem: "TikTok",
      procedureInteresse: "Volume Brasileiro",
      valorEstimado: 180,
      observacoes: "Pediu desconto, aguardando retorno",
      stage: "orcamento",
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeOrgCollection(orgId, "leads", leads);
  writeOrgCollection(orgId, "lead_activities", []);

  console.log("Seed concluído!\n");
  console.log("Login MASTER (gerencia as organizações):");
  console.log("  e-mail: master@studio.com | senha: master1234\n");
  console.log(`Login da organização demo (${org.nome}):`);
  console.log("  e-mail: demo@studio.com | senha: demo1234");
}

main();
