"use client";

import { useEffect, useState } from "react";
import { Plus, X, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import {
  TRANSACTION_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  FINANCIAL_CATEGORIES_RECEITA,
  FINANCIAL_CATEGORIES_DESPESA,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction, TransactionType, PaymentMethod, Client } from "@/types";

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([fetch("/api/transactions"), fetch("/api/clients")]);
    setTransactions(await tRes.json());
    setClients(await cRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remover este lançamento?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  }

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const receitas = transactions.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
  const despesas = transactions.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Financeiro
          </h1>
          <p className="mt-1 text-sm text-muted">Fluxo de caixa e lançamentos.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Novo lançamento
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Receitas" value={formatCurrency(receitas)} icon={TrendingUp} />
        <KpiCard label="Despesas" value={formatCurrency(despesas)} icon={TrendingDown} />
        <KpiCard label="Saldo" value={formatCurrency(receitas - despesas)} icon={Scale} />
      </div>

      <div className="card divide-y divide-border">
        {loading ? (
          <p className="p-6 text-sm text-muted">Carregando...</p>
        ) : transactions.length === 0 ? (
          <div className="lash-curve inline-block p-8 text-sm text-muted" data-active="true">
            Nenhum lançamento registrado ainda.
          </div>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{t.categoria}</p>
                <p className="truncate text-xs text-muted">
                  {formatDate(t.data)}
                  {t.clientId ? ` · ${clientById.get(t.clientId)?.nome ?? "Cliente"}` : ""}
                  {t.metodoPagamento ? ` · ${PAYMENT_METHOD_LABEL[t.metodoPagamento]}` : ""}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-semibold ${
                  t.tipo === "receita" ? "text-success" : "text-danger"
                }`}
              >
                {t.tipo === "receita" ? "+" : "−"} {formatCurrency(t.valor)}
              </p>
              <button
                onClick={() => handleDelete(t.id)}
                className="shrink-0 text-xs text-muted hover:text-danger"
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <TransactionFormModal
          clients={clients}
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

function TransactionFormModal({
  clients,
  onClose,
  onSaved,
}: {
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo: "receita" as TransactionType,
    categoria: "",
    metodoPagamento: "pix" as PaymentMethod,
    valor: "",
    clientId: "",
    descricao: "",
    data: new Date().toISOString().slice(0, 10),
  });

  const categorias = form.tipo === "receita" ? FINANCIAL_CATEGORIES_RECEITA : FINANCIAL_CATEGORIES_DESPESA;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        valor: Number(form.valor),
        clientId: form.clientId || undefined,
        metodoPagamento: form.tipo === "receita" ? form.metodoPagamento : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Verifique os campos obrigatórios.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Novo lançamento
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {(["receita", "despesa"] as const).map((tipo) => (
              <button
                type="button"
                key={tipo}
                onClick={() => setForm((f) => ({ ...f, tipo, categoria: "" }))}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  form.tipo === tipo
                    ? "border-accent bg-accent text-white"
                    : "border-border text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {TRANSACTION_TYPE_LABEL[tipo]}
              </button>
            ))}
          </div>

          <select
            required
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className="input"
          >
            <option value="">Categoria</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            required
            type="number"
            step="0.01"
            placeholder="Valor (R$)"
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            className="input"
          />

          {form.tipo === "receita" && (
            <>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="input"
              >
                <option value="">Cliente (opcional)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <select
                value={form.metodoPagamento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metodoPagamento: e.target.value as PaymentMethod }))
                }
                className="input"
              >
                {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            type="date"
            required
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            className="input"
          />

          <input
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="input"
          />

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar lançamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
