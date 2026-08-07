"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Badge } from "@/components/Badge";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/constants";
import { formatTime } from "@/lib/format";
import type { Appointment, Client, Procedure, AppointmentStatus } from "@/types";

const APPT_TONE: Record<AppointmentStatus, "accent" | "success" | "danger" | "neutral"> = {
  agendado: "accent",
  confirmado: "accent",
  compareceu: "success",
  cancelado: "danger",
  faltou: "danger",
};

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function AgendaPage() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { start, end } = dayRange(date);
    const [apptRes, clientsRes, proceduresRes] = await Promise.all([
      fetch(`/api/appointments?start=${start}&end=${end}`),
      fetch("/api/clients"),
      fetch("/api/procedures"),
    ]);
    setAppointments(await apptRes.json());
    setClients(await clientsRes.json());
    setProcedures(await proceduresRes.json());
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const procedureById = new Map(procedures.map((p) => [p.id, p]));

  async function updateStatus(id: string, status: AppointmentStatus) {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function changeDay(delta: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next);
  }

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Agenda
          </h1>
          <p className="mt-1 text-sm text-muted">
            {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            {isToday && (
              <span className="ml-2">
                <Badge tone="accent">Hoje</Badge>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Novo agendamento
        </button>
      </div>

      <div className="mb-5 flex items-center justify-center gap-4">
        <button
          onClick={() => changeDay(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
        >
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setDate(new Date())} className="text-sm font-medium text-accent hover:underline">
          Ir para hoje
        </button>
        <button
          onClick={() => changeDay(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="card divide-y divide-border">
        {loading ? (
          <p className="p-6 text-sm text-muted">Carregando...</p>
        ) : appointments.length === 0 ? (
          <div className="lash-curve inline-block p-8 text-sm text-muted" data-active="true">
            Nenhum agendamento para este dia.
          </div>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div className="w-16 shrink-0 text-sm font-semibold text-foreground">
                {formatTime(a.startAt)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {clientById.get(a.clientId)?.nome ?? "Cliente removido"}
                </p>
                <p className="truncate text-xs text-muted">
                  {procedureById.get(a.procedureId)?.nome ?? "Procedimento"} · {a.profissional}
                </p>
              </div>
              <select
                value={a.status}
                onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none"
              >
                {Object.entries(APPOINTMENT_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Badge tone={APPT_TONE[a.status]}>{APPOINTMENT_STATUS_LABEL[a.status]}</Badge>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <AppointmentFormModal
          date={date}
          clients={clients}
          procedures={procedures}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AppointmentFormModal({
  date,
  clients,
  procedures,
  onClose,
  onSaved,
}: {
  date: Date;
  clients: Client[];
  procedures: Procedure[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultDate = date.toISOString().slice(0, 10);
  const [form, setForm] = useState({
    clientId: "",
    procedureId: "",
    profissional: "",
    data: defaultDate,
    hora: "09:00",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const procedure = procedures.find((p) => p.id === form.procedureId);
    const start = new Date(`${form.data}T${form.hora}:00`);
    const end = new Date(start.getTime() + (procedure?.tempoMedioMin ?? 60) * 60000);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        procedureId: form.procedureId,
        profissional: form.profissional,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        status: "agendado",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Novo agendamento
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            required
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            className="input"
          >
            <option value="">Selecione o cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            required
            value={form.procedureId}
            onChange={(e) => setForm((f) => ({ ...f, procedureId: e.target.value }))}
            className="input"
          >
            <option value="">Selecione o procedimento</option>
            {procedures.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.tempoMedioMin} min)
              </option>
            ))}
          </select>

          <input
            required
            placeholder="Profissional responsável"
            value={form.profissional}
            onChange={(e) => setForm((f) => ({ ...f, profissional: e.target.value }))}
            className="input"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              className="input"
            />
            <input
              required
              type="time"
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
              className="input"
            />
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
