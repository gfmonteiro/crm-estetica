"use client";

import { useEffect, useState } from "react";
import { Plus, Clock, Percent, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Procedure } from "@/types";

export default function ProcedimentosPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/procedures");
    setProcedures(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remover este procedimento?")) return;
    await fetch(`/api/procedures/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Procedimentos
          </h1>
          <p className="mt-1 text-sm text-muted">Catálogo de serviços oferecidos.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Novo procedimento
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : procedures.length === 0 ? (
        <div className="card lash-curve inline-block p-8 text-sm text-muted" data-active="true">
          Nenhum procedimento cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {procedures.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-foreground">{p.nome}</h3>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-muted hover:text-danger"
                >
                  Remover
                </button>
              </div>
              <p className="mb-3 font-[family-name:var(--font-display)] text-xl text-accent-strong">
                {formatCurrency(p.valor)}
              </p>
              {p.descricao && <p className="mb-3 text-sm text-muted">{p.descricao}</p>}
              <div className="flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {p.tempoMedioMin} min
                </span>
                <span className="flex items-center gap-1">
                  <Percent size={13} /> {p.comissaoPercentual}% comissão
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProcedureFormModal
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

function ProcedureFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    valor: "",
    tempoMedioMin: "",
    comissaoPercentual: "",
    descricao: "",
    materiais: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/procedures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome,
        valor: Number(form.valor),
        tempoMedioMin: Number(form.tempoMedioMin),
        comissaoPercentual: Number(form.comissaoPercentual || 0),
        descricao: form.descricao,
        materiais: form.materiais,
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
            Novo procedimento
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Nome do procedimento"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="input"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              required
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              className="input"
            />
            <input
              required
              type="number"
              placeholder="Tempo (min)"
              value={form.tempoMedioMin}
              onChange={(e) => setForm((f) => ({ ...f, tempoMedioMin: e.target.value }))}
              className="input"
            />
            <input
              type="number"
              placeholder="Comissão %"
              value={form.comissaoPercentual}
              onChange={(e) => setForm((f) => ({ ...f, comissaoPercentual: e.target.value }))}
              className="input"
            />
          </div>
          <textarea
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="input min-h-16"
          />
          <input
            placeholder="Materiais utilizados"
            value={form.materiais}
            onChange={(e) => setForm((f) => ({ ...f, materiais: e.target.value }))}
            className="input"
          />

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar procedimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
