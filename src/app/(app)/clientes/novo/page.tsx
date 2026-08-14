"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CLIENT_TAGS, CLIENT_ORIGINS } from "@/lib/constants";
import type { ClientTag } from "@/types";

export default function NovoClientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    whatsapp: "",
    email: "",
    cpf: "",
    dataNascimento: "",
    sexo: "",
    endereco: "",
    cidade: "",
    estado: "",
    origem: "",
    profissao: "",
    observacoes: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(tag: ClientTag) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags, status: "ativo" }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Verifique os campos obrigatórios (nome e telefone).");
      return;
    }
    const client = await res.json();
    router.push(`/clientes/${client.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/clientes" className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Voltar para clientes
      </Link>

      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl text-foreground">
        Novo clienteOOO
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6 p-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Dados básicos</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome completo" required>
              <input
                required
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Telefone" required>
              <input
                required
                value={form.telefone}
                onChange={(e) => update("telefone", e.target.value)}
                className="input"
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                className="input"
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="CPF">
              <input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} className="input" />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                value={form.dataNascimento}
                onChange={(e) => update("dataNascimento", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Sexo">
              <select value={form.sexo} onChange={(e) => update("sexo", e.target.value)} className="input">
                <option value="">Selecionar</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </Field>
            <Field label="Profissão">
              <input
                value={form.profissao}
                onChange={(e) => update("profissao", e.target.value)}
                className="input"
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Endereço</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Endereço">
              <input
                value={form.endereco}
                onChange={(e) => update("endereco", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Cidade">
              <input value={form.cidade} onChange={(e) => update("cidade", e.target.value)} className="input" />
            </Field>
            <Field label="Estado">
              <input value={form.estado} onChange={(e) => update("estado", e.target.value)} className="input" />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Origem e tags</h2>
          <Field label="Origem do cliente">
            <select value={form.origem} onChange={(e) => update("origem", e.target.value)} className="input">
              <option value="">Selecionar</option>
              {CLIENT_ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-3 flex flex-wrap gap-2">
            {CLIENT_TAGS.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  tags.includes(tag)
                    ? "border-accent bg-accent text-white"
                    : "border-border text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <Field label="Observações">
          <textarea
            value={form.observacoes}
            onChange={(e) => update("observacoes", e.target.value)}
            className="input min-h-20"
          />
        </Field>

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link
            href="/clientes"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
