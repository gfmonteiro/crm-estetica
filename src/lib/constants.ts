import type { ClientTag, AppointmentStatus, TransactionType, PipelineStage, QuestionType } from "@/types";

export const CLIENT_TAGS: ClientTag[] = [
  "VIP",
  "Influencer",
  "Cliente recorrente",
  "Primeira visita",
  "Inadimplente",
  "Gestante",
];

export const CLIENT_ORIGINS = [
  "Instagram",
  "Facebook",
  "Google",
  "Indicação",
  "TikTok",
  "Site",
  "Outros",
];

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  compareceu: "Compareceu",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
};

export const FINANCIAL_CATEGORIES_RECEITA = [
  "Procedimento",
  "Venda de produto",
  "Outros",
];

export const FINANCIAL_CATEGORIES_DESPESA = [
  "Materiais e insumos",
  "Aluguel",
  "Marketing",
  "Comissão",
  "Outros",
];

export const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: "novo_lead", label: "Novo Lead" },
  { key: "contato", label: "Contato" },
  { key: "orcamento", label: "Orçamento" },
  { key: "agendado", label: "Agendado" },
  { key: "compareceu", label: "Compareceu" },
  { key: "finalizado", label: "Finalizado" },
  { key: "retorno", label: "Retorno" },
  { key: "perdido", label: "Perdido" },
];

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  texto_curto: "Texto curto",
  texto_longo: "Texto longo",
  sim_nao: "Sim / Não",
  unica_escolha: "Escolha única",
  multipla_escolha: "Múltipla escolha",
  data: "Data",
  numero: "Número",
};
