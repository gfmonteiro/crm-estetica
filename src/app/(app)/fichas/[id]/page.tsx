"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Save,
  Check,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { QUESTION_TYPE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { AnamnesisForm, AnamnesisCategory, AnamnesisQuestion, AnamnesisResponse, QuestionType } from "@/types";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function EditarFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<AnamnesisForm | null>(null);
  const [categorias, setCategorias] = useState<AnamnesisCategory[]>([]);
  const [responses, setResponses] = useState<AnamnesisResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStructure, setSavingStructure] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [formRes, responsesRes] = await Promise.all([
      fetch(`/api/anamnesis-forms/${id}`),
      fetch(`/api/anamnesis-forms/${id}/responses`),
    ]);
    const formData = await formRes.json();
    setForm(formData);
    setCategorias(formData.categorias ?? []);
    setResponses(await responsesRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings(patch: Partial<Pick<AnamnesisForm, "nome" | "corFundo" | "logoUrl" | "ativo">>) {
    if (!id || !form) return;
    const updated = { ...form, ...patch };
    setForm(updated);
    await fetch(`/api/anamnesis-forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function saveStructure() {
    if (!id) return;
    setSavingStructure(true);
    await fetch(`/api/anamnesis-forms/${id}/structure`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorias }),
    });
    setSavingStructure(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function addCategoria() {
    setCategorias((cs) => [...cs, { id: newId(), nome: "Nova categoria", ordem: cs.length, perguntas: [] }]);
  }

  function updateCategoria(catId: string, patch: Partial<AnamnesisCategory>) {
    setCategorias((cs) => cs.map((c) => (c.id === catId ? { ...c, ...patch } : c)));
  }

  function removeCategoria(catId: string) {
    if (!confirm("Remover esta categoria e todas as perguntas dela?")) return;
    setCategorias((cs) => cs.filter((c) => c.id !== catId));
  }

  function moveCategoria(catId: string, dir: -1 | 1) {
    setCategorias((cs) => {
      const idx = cs.findIndex((c) => c.id === catId);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= cs.length) return cs;
      const next = [...cs];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next.map((c, i) => ({ ...c, ordem: i }));
    });
  }

  function addPergunta(catId: string) {
    setCategorias((cs) =>
      cs.map((c) =>
        c.id === catId
          ? {
              ...c,
              perguntas: [
                ...c.perguntas,
                {
                  id: newId(),
                  texto: "",
                  tipo: "texto_curto" as QuestionType,
                  obrigatoria: false,
                  ordem: c.perguntas.length,
                },
              ],
            }
          : c
      )
    );
  }

  function updatePergunta(catId: string, qId: string, patch: Partial<AnamnesisQuestion>) {
    setCategorias((cs) =>
      cs.map((c) =>
        c.id === catId
          ? { ...c, perguntas: c.perguntas.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }
          : c
      )
    );
  }

  function removePergunta(catId: string, qId: string) {
    setCategorias((cs) =>
      cs.map((c) => (c.id === catId ? { ...c, perguntas: c.perguntas.filter((q) => q.id !== qId) } : c))
    );
  }

  function movePergunta(catId: string, qId: string, dir: -1 | 1) {
    setCategorias((cs) =>
      cs.map((c) => {
        if (c.id !== catId) return c;
        const idx = c.perguntas.findIndex((q) => q.id === qId);
        const swapWith = idx + dir;
        if (swapWith < 0 || swapWith >= c.perguntas.length) return c;
        const next = [...c.perguntas];
        [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
        return { ...c, perguntas: next.map((q, i) => ({ ...q, ordem: i })) };
      })
    );
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveSettings({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  if (loading || !form) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <Link href="/fichas" className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Voltar para fichas
      </Link>

      {/* Aparência */}
      <div className="card mb-5 p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Aparência</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Nome da ficha</span>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              onBlur={(e) => saveSettings({ nome: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Cor de fundo</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.corFundo}
                onChange={(e) => saveSettings({ corFundo: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
              />
              <span className="text-xs text-muted">{form.corFundo}</span>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Logomarca (opcional)
          </span>
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg border border-border object-contain bg-white" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border text-muted">
                <ImageIcon size={16} />
              </div>
            )}
            <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent">
              {form.logoUrl ? "Trocar imagem" : "Enviar imagem"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {form.logoUrl && (
              <button
                onClick={() => saveSettings({ logoUrl: undefined })}
                className="text-xs text-muted hover:text-danger"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => saveSettings({ ativo: e.target.checked })}
          />
          Ficha ativa (só fichas ativas podem gerar link novo)
        </label>
      </div>

      {/* Categorias e perguntas */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Categorias e perguntas</h2>
        <button
          onClick={saveStructure}
          disabled={savingStructure}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {savedFlash ? <Check size={14} /> : <Save size={14} />}
          {savingStructure ? "Salvando..." : savedFlash ? "Salvo!" : "Salvar perguntas"}
        </button>
      </div>

      <div className="space-y-4">
        {categorias.map((cat, catIdx) => (
          <div key={cat.id} className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  disabled={catIdx === 0}
                  onClick={() => moveCategoria(cat.id, -1)}
                  className="text-muted hover:text-foreground disabled:opacity-20"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  disabled={catIdx === categorias.length - 1}
                  onClick={() => moveCategoria(cat.id, 1)}
                  className="text-muted hover:text-foreground disabled:opacity-20"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <input
                value={cat.nome}
                onChange={(e) => updateCategoria(cat.id, { nome: e.target.value })}
                className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-foreground hover:border-border focus:border-accent focus:outline-none"
              />
              <button onClick={() => removeCategoria(cat.id)} className="text-muted hover:text-danger">
                <Trash2 size={15} />
              </button>
            </div>

            <div className="space-y-2 pl-6">
              {cat.perguntas.map((q, qIdx) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  isFirst={qIdx === 0}
                  isLast={qIdx === cat.perguntas.length - 1}
                  onChange={(patch) => updatePergunta(cat.id, q.id, patch)}
                  onRemove={() => removePergunta(cat.id, q.id)}
                  onMove={(dir) => movePergunta(cat.id, q.id, dir)}
                />
              ))}

              <button
                onClick={() => addPergunta(cat.id)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted hover:border-accent hover:text-accent"
              >
                <Plus size={13} />
                Adicionar pergunta
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addCategoria}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted hover:border-accent hover:text-accent"
        >
          <Plus size={15} />
          Adicionar categoria
        </button>
      </div>

      {/* Respostas recebidas */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Respostas recebidas</h2>
        {responses.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma resposta recebida ainda.</p>
        ) : (
          <div className="card divide-y divide-border">
            {responses.map((r) => (
              <Link
                key={r.id}
                href={`/fichas/respostas/${r.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent-soft/40"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.respondenteNome || "Aguardando preenchimento"}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(r.createdAt)}</p>
                </div>
                <Badge
                  tone={
                    r.status === "concluida" ? "success" : r.status === "assinada_cliente" ? "accent" : "neutral"
                  }
                >
                  {r.status === "concluida"
                    ? "Concluída"
                    : r.status === "assinada_cliente"
                      ? "Aguardando sua assinatura"
                      : "Pendente"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  question: AnamnesisQuestion;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<AnamnesisQuestion>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const needsOptions = question.tipo === "unica_escolha" || question.tipo === "multipla_escolha";

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        <div className="mt-1 flex flex-col">
          <button disabled={isFirst} onClick={() => onMove(-1)} className="text-muted hover:text-foreground disabled:opacity-20">
            <ChevronUp size={13} />
          </button>
          <button disabled={isLast} onClick={() => onMove(1)} className="text-muted hover:text-foreground disabled:opacity-20">
            <ChevronDown size={13} />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          <input
            placeholder="Texto da pergunta"
            value={question.texto}
            onChange={(e) => onChange({ texto: e.target.value })}
            className="input"
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={question.tipo}
              onChange={(e) => onChange({ tipo: e.target.value as QuestionType })}
              className="input w-auto"
            >
              {Object.entries(QUESTION_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={question.obrigatoria}
                onChange={(e) => onChange({ obrigatoria: e.target.checked })}
              />
              Obrigatória
            </label>
          </div>

          {needsOptions && (
            <input
              placeholder="Opções separadas por vírgula (ex.: Nenhuma, Leve, Moderada, Intensa)"
              value={(question.opcoes ?? []).join(", ")}
              onChange={(e) =>
                onChange({ opcoes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
              className="input"
            />
          )}
        </div>

        <button onClick={onRemove} className="mt-1 text-muted hover:text-danger">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
