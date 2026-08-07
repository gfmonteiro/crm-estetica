"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Cake, Briefcase } from "lucide-react";
import { Badge } from "@/components/Badge";
import { APPOINTMENT_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Client, Appointment, Transaction, Procedure } from "@/types";

const STATUS_TONE = {
  ativo: "success",
  inativo: "neutral",
  bloqueado: "danger",
} as const;

const APPT_TONE: Record<string, "accent" | "success" | "danger" | "neutral"> = {
  agendado: "accent",
  confirmado: "accent",
  compareceu: "success",
  cancelado: "danger",
  faltou: "danger",
};

export default function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"historico" | "financeiro" | "dados">("historico");

  useEffect(() => {
    async function load() {
      const [detailRes, proceduresRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch("/api/procedures"),
      ]);
      const detail = await detailRes.json();
      const proceduresData = await proceduresRes.json();
      setClient(detail.client);
      setAppointments(detail.appointments);
      setTransactions(detail.transactions);
      setProcedures(proceduresData);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (!client) return <p className="text-sm text-muted">Cliente não encontrado.</p>;

  const procedureById = new Map(procedures.map((p) => [p.id, p]));
  const totalGasto = transactions
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/clientes" className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Voltar para clientes
      </Link>

      <div className="card mb-5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
              {client.nome}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={STATUS_TONE[client.status]}>{client.status}</Badge>
              {client.tags.map((tag) => (
                <Badge key={tag} tone="accent">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Total investido</p>
            <p className="font-[family-name:var(--font-display)] text-xl text-foreground">
              {formatCurrency(totalGasto)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
          <InfoItem icon={Phone} label={client.whatsapp || client.telefone} />
          {client.email && <InfoItem icon={Mail} label={client.email} />}
          {client.cidade && <InfoItem icon={MapPin} label={`${client.cidade}${client.estado ? `/${client.estado}` : ""}`} />}
          {client.dataNascimento && (
            <InfoItem icon={Cake} label={formatDate(client.dataNascimento)} />
          )}
          {client.profissao && <InfoItem icon={Briefcase} label={client.profissao} />}
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {(["historico", "financeiro", "dados"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`lash-curve px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "text-foreground" : "text-muted"
            }`}
            data-active={tab === t}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "historico" && (
        <div className="card divide-y divide-border">
          {appointments.length === 0 ? (
            <p className="p-6 text-sm text-muted">Nenhum atendimento registrado ainda.</p>
          ) : (
            appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {procedureById.get(a.procedureId)?.nome ?? "Procedimento"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDateTime(a.startAt)} · {a.profissional}
                  </p>
                </div>
                <Badge tone={APPT_TONE[a.status]}>{APPOINTMENT_STATUS_LABEL[a.status]}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "financeiro" && (
        <div className="card divide-y divide-border">
          {transactions.length === 0 ? (
            <p className="p-6 text-sm text-muted">Nenhum lançamento financeiro ainda.</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.categoria}</p>
                  <p className="text-xs text-muted">
                    {formatDate(t.data)}
                    {t.metodoPagamento ? ` · ${PAYMENT_METHOD_LABEL[t.metodoPagamento]}` : ""}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    t.tipo === "receita" ? "text-success" : "text-danger"
                  }`}
                >
                  {t.tipo === "receita" ? "+" : "−"} {formatCurrency(t.valor)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "dados" && (
        <div className="card grid grid-cols-2 gap-4 p-6 text-sm">
          <DadoItem label="CPF" value={client.cpf} />
          <DadoItem label="Sexo" value={client.sexo} />
          <DadoItem label="Endereço" value={client.endereco} />
          <DadoItem label="Origem" value={client.origem} />
          <DadoItem label="Observações" value={client.observacoes} full />
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={14} />
      {label}
    </span>
  );
}

function DadoItem({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-foreground">{value || "—"}</p>
    </div>
  );
}
