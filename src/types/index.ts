export type ClientStatus = "ativo" | "inativo" | "bloqueado";

export type ClientTag =
  | "VIP"
  | "Influencer"
  | "Cliente recorrente"
  | "Primeira visita"
  | "Inadimplente"
  | "Gestante";

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
  dataNascimento?: string; // ISO date
  sexo?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  origem?: string;
  profissao?: string;
  observacoes?: string;
  status: ClientStatus;
  tags: ClientTag[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Procedure {
  id: string;
  nome: string;
  valor: number;
  tempoMedioMin: number;
  comissaoPercentual: number;
  descricao?: string;
  materiais?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "compareceu"
  | "cancelado"
  | "faltou";

export interface Appointment {
  id: string;
  clientId: string;
  procedureId: string;
  profissional: string;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  status: AppointmentStatus;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "receita" | "despesa";
export type PaymentMethod = "pix" | "cartao" | "dinheiro" | "boleto";

export interface Transaction {
  id: string;
  clientId?: string;
  appointmentId?: string;
  tipo: TransactionType;
  categoria: string;
  metodoPagamento?: PaymentMethod;
  valor: number;
  descricao?: string;
  data: string; // ISO date
  createdAt: string;
}

export type OrganizationStatus = "ativo" | "suspenso";

/**
 * Uma organização = um negócio cliente do seu sistema (uma Lash Designer,
 * uma clínica, uma Nail Designer...). Cada organização tem seus próprios
 * clientes, agenda, financeiro etc., totalmente isolados das demais.
 */
export interface Organization {
  id: string;
  nome: string;
  tipoNegocio: string; // "Lash Designer", "Clínica de Estética", "Nail Designer"...
  email: string;
  telefone?: string;
  status: OrganizationStatus;
  plano?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "master" | "admin" | "profissional";

export interface User {
  id: string;
  nome: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  // Ausente/undefined só para o usuário "master" (dono da plataforma).
  organizationId?: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
}

/**
 * Regra de automação de mensagem: dispara X dias após o atendimento
 * (status = "compareceu"). A mensagem suporta coringas que são
 * substituídos no momento do envio — ver `renderMessage` em
 * `src/lib/whatsapp.ts`.
 */
export interface AutomationRule {
  id: string;
  nome: string;
  diasAposAtendimento: number;
  mensagem: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppSettings {
  phoneNumberId: string;
  accessToken: string;
  updatedAt: string;
}

export interface WhatsAppLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  clientId: string;
  clientName: string;
  appointmentId: string;
  mensagemEnviada: string;
  status: "enviado" | "erro" | "simulado";
  detalhe?: string;
  createdAt: string;
}

export type PipelineStage =
  | "novo_lead"
  | "contato"
  | "orcamento"
  | "agendado"
  | "compareceu"
  | "finalizado"
  | "retorno"
  | "perdido";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  origem?: string;
  procedureInteresse?: string;
  valorEstimado?: number;
  observacoes?: string;
  stage: PipelineStage;
  clientId?: string; // preenchido quando o lead é convertido em cliente
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  descricao: string;
  createdAt: string;
}
