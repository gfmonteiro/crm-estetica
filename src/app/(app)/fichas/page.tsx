"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, FileText, Link2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/Badge";
import type { AnamnesisForm } from "@/types";

export default function FichasPage() {
  const [forms, setForms] = useState<AnamnesisForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [linkModalForm, setLinkModalForm] = useState<AnamnesisForm | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/anamnesis-forms");
    setForms(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remover esta ficha? As respostas jÃ¡ recebidas continuam guardadas.")) return;
    await fetch(`/api/anamnesis-forms/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Fichas de Anamnese
          </h1>
          <p className="mt-1 text-sm text-muted">Crie modelos, monte as perguntas e envie o link.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Nova ficha
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : forms.length === 0 ? (
        <div className="card lash-curve inline-block p-8 text-sm text-muted" data-active="true">
          Nenhuma ficha criada ainda. Crie a primeira para montar suas perguntas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {forms.map((form) => {
            const totalPerguntas = form.categorias.reduce((s, c) => s + c.perguntas.length, 0);
            return (
              <div key={form.id} className="card overflow-hidden">
                <div className="h-2" style={{ backgroundColor: form.corFundo }} />
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-muted" />
                      <p className="font-medium text-foreground">{form.nome}</p>
                    </div>
                    <Badge tone={form.ativo ? "success" : "neutral"}>
                      {form.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <p className="mb-4 text-xs text-muted">
                    {form.categorias.length} categoria(s) Â· {totalPerguntas} pergunta(s)
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <Link href={`/fichas/${form.id}`} className="font-medium text-accent hover:underline">
                      Editar perguntas
                    </Link>
                    <button
                      onClick={() => setLinkModalForm(form)}
                      className="flex items-center gap-1 font-medium text-accent hover:underline"
                    >
                      <Link2 size={12} />
                      Gerar link
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="font-medium text-muted hover:text-danger"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <NewFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {linkModalForm && (
        <GenerateLinkModal form={linkModalForm} onClose={() => setLinkModalForm(null)} />
      )}
    </div>
  );
}

function NewFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [corFundo, setCorFundo] = useState("#FAF8FB");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/anamnesis-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, corFundo }),
    });
    setSaving(false);
    if (!res.ok) {
      if (res.status === 401) {
        setError("Sua sessão expirou. Faça login novamente.");
      } else if (res.status === 400) {
        setError("O nome da ficha deve ter pelo menos 2 caracteres.");
      } else {
        setError("Não foi possível criar a ficha. Tente novamente.");
      }
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Nova ficha
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Nome da ficha (ex.: Anamnese Lash Design)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input"
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Cor de fundo</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={corFundo}
                onChange={(e) => setCorFundo(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
              />
              <span className="text-xs text-muted">{corFundo}</span>
            </div>
          </label>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Criando..." : "Criar e editar perguntas"}
          </button>
        </form>
      </div>
    </div>
  );
}

function GenerateLinkModal({ form, onClose }: { form: AnamnesisForm; onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [respondenteNome, setRespondenteNome] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/anamnesis-forms/${form.id}/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respondenteNome: respondenteNome || undefined }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error || "NÃ£o foi possÃ­vel gerar o link.");
      return;
    }
    setUrl(`${window.location.origin}${data.path}`);
  }

  function copyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Link â {form.nome}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {!url ? (
          <form onSubmit={handleGenerate} className="space-y-3">
            <input
              placeholder="Nome da cliente (opcional)"
              value={respondenteNome}
              onChange={(e) => setRespondenteNome(e.target.value)}
              className="input"
            />
            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={generating}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? "Gerando..." : "Gerar link"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Envie esse link pra cliente preencher e assinar. Ele funciona uma Ãºnica vez.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{url}</span>
              <button onClick={copyLink} className="shrink-0 text-accent hover:opacity-80">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
