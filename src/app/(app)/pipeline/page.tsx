"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, X, Search, UserPlus, Phone } from "lucide-react";
import { Badge } from "@/components/Badge";
import { PIPELINE_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Lead, PipelineStage } from "@/types";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leads");
    setLeads(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = leads.filter((l) =>
    query ? l.nome.toLowerCase().includes(query.toLowerCase()) || l.telefone.includes(query) : true
  );

  async function moveLead(leadId: string, stage: PipelineStage) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
    await fetch(`/api/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  function handleDrop(stage: PipelineStage) {
    if (draggingId) moveLead(draggingId, stage);
    setDraggingId(null);
    setDragOverStage(null);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Pipeline de vendas
          </h1>
          <p className="mt-1 text-sm text-muted">{leads.length} lead(s) no funil.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Novo lead
        </button>
      </div>

      <div className="mb-5 flex max-w-sm items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.stage === stage.key);
            return (
              <div
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.key);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(stage.key)}
                className={`w-64 shrink-0 rounded-xl border transition-colors ${
                  dragOverStage === stage.key
                    ? "border-accent bg-accent-soft/40"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {stage.label}
                  </p>
                  <span className="rounded-full bg-border/60 px-2 py-0.5 text-xs font-medium text-muted">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="min-h-16 space-y-2 p-2">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      dragging={draggingId === lead.id}
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onUpdated={load}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <LeadFormModal
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

function LeadCard({
  lead,
  dragging,
  onDragStart,
  onDragEnd,
  onUpdated,
}: {
  lead: Lead;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onUpdated: () => void;
}) {
  const [converting, setConverting] = useState(false);

  async function handleConvert(e: React.MouseEvent) {
    e.stopPropagation();
    setConverting(true);
    await fetch(`/api/leads/${lead.id}/convert`, { method: "POST" });
    setConverting(false);
    onUpdated();
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm transition-opacity active:cursor-grabbing ${
        dragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <p className="text-sm font-medium text-foreground">{lead.nome}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
        <Phone size={11} />
        {lead.telefone}
      </p>
      {lead.procedureInteresse && (
        <p className="mt-1.5 text-xs text-muted">{lead.procedureInteresse}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        {lead.valorEstimado ? (
          <Badge tone="accent">{formatCurrency(lead.valorEstimado)}</Badge>
        ) : (
          <span />
        )}
        {lead.clientId ? (
          <Link href={`/clientes/${lead.clientId}`} className="text-xs font-medium text-accent hover:underline">
            Ver cliente
          </Link>
        ) : (
          <button
            onClick={handleConvert}
            disabled={converting}
            title="Converter em cliente"
            className="flex items-center gap-1 text-xs font-medium text-muted hover:text-accent disabled:opacity-50"
          >
            <UserPlus size={12} />
            {converting ? "..." : "Converter"}
          </button>
        )}
      </div>
    </div>
  );
}

function LeadFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    origem: "",
    procedureInteresse: "",
    valorEstimado: "",
    observacoes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
        stage: "novo_lead",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Verifique os campos obrigatórios (nome e telefone).");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Novo lead
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="input"
          />
          <input
            required
            placeholder="Telefone / WhatsApp"
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
            className="input"
          />
          <input
            type="email"
            placeholder="E-mail (opcional)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="input"
          />
          <input
            placeholder="Origem (Instagram, Indicação...)"
            value={form.origem}
            onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))}
            className="input"
          />
          <input
            placeholder="Procedimento de interesse"
            value={form.procedureInteresse}
            onChange={(e) => setForm((f) => ({ ...f, procedureInteresse: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor estimado (R$, opcional)"
            value={form.valorEstimado}
            onChange={(e) => setForm((f) => ({ ...f, valorEstimado: e.target.value }))}
            className="input"
          />
          <textarea
            placeholder="Observações"
            value={form.observacoes}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            className="input min-h-16"
          />

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Adicionar lead"}
          </button>
        </form>
      </div>
    </div>
  );
}
