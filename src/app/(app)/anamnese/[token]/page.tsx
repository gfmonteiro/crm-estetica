"use client";

import { useEffect, useState, useRef, use as usePromise } from "react";
import { CheckCircle2 } from "lucide-react";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import type { AnamnesisForm, AnamnesisResponse } from "@/types";

export default function PreencherFichaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params);
  const [form, setForm] = useState<AnamnesisForm | null>(null);
  const [response, setResponse] = useState<AnamnesisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [respondenteNome, setRespondenteNome] = useState("");
  const [respondenteTelefone, setRespondenteTelefone] = useState("");
  const [respostas, setRespostas] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const sigRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    fetch(`/api/public/anamnesis/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          setNotFound(true);
          return;
        }
        const data = await r.json();
        setForm(data.form);
        setResponse(data.response);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function setResposta(questionId: string, value: string | string[]) {
    setRespostas((r) => ({ ...r, [questionId]: value }));
  }

  function toggleMultipla(questionId: string, opcao: string) {
    setRespostas((r) => {
      const atual = (r[questionId] as string[] | undefined) ?? [];
      const next = atual.includes(opcao) ? atual.filter((o) => o !== opcao) : [...atual, opcao];
      return { ...r, [questionId]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form) return;
    const obrigatoriasFaltando = form.categorias
      .flatMap((c) => c.perguntas)
      .filter((q) => q.obrigatoria)
      .some((q) => {
        const v = respostas[q.id];
        return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      });
    if (obrigatoriasFaltando) {
      setError("Preencha todas as perguntas obrigatórias antes de enviar.");
      return;
    }

    const assinaturaDataUrl = sigRef.current?.getDataUrl();
    if (!assinaturaDataUrl) {
      setError("Assine no quadro antes de enviar.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/public/anamnesis/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respondenteNome, respondenteTelefone, respostas, assinaturaDataUrl }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Não foi possível enviar. Tente novamente.");
      return;
    }
    setDone(true);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Carregando...</div>;

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-muted">Este link não é válido ou expirou.</p>
      </div>
    );
  }

  if (response?.status !== "pendente" || done) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 text-center"
        style={{ backgroundColor: form?.corFundo }}
      >
        <div className="card max-w-sm p-8">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-success" />
          <p className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Ficha enviada com sucesso!
          </p>
          <p className="mt-1 text-sm text-muted">
            Obrigado por preencher. Sua profissional já tem acesso às respostas.
          </p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: form.corFundo }}>
      <div className="mx-auto max-w-xl px-4">
        {form.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.logoUrl} alt="Logo" className="mx-auto mb-4 h-16 w-16 rounded-full border border-border bg-white object-contain" />
        )}
        <h1 className="mb-1 text-center font-[family-name:var(--font-display)] text-2xl text-foreground">
          {form.nome}
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Preencha com atenção — as informações ajudam a garantir um atendimento seguro.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-3 p-5">
            <input
              required
              placeholder="Seu nome completo"
              value={respondenteNome}
              onChange={(e) => setRespondenteNome(e.target.value)}
              className="input"
            />
            <input
              placeholder="Telefone / WhatsApp"
              value={respondenteTelefone}
              onChange={(e) => setRespondenteTelefone(e.target.value)}
              className="input"
            />
          </div>

          {form.categorias.map((cat) => (
            <div key={cat.id} className="card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{cat.nome}</h2>
              <div className="space-y-4">
                {cat.perguntas.map((q) => (
                  <div key={q.id}>
                    <label className="mb-1.5 block text-sm text-foreground">
                      {q.texto} {q.obrigatoria && <span className="text-danger">*</span>}
                    </label>

                    {q.tipo === "texto_curto" && (
                      <input
                        required={q.obrigatoria}
                        value={(respostas[q.id] as string) ?? ""}
                        onChange={(e) => setResposta(q.id, e.target.value)}
                        className="input"
                      />
                    )}

                    {q.tipo === "texto_longo" && (
                      <textarea
                        required={q.obrigatoria}
                        value={(respostas[q.id] as string) ?? ""}
                        onChange={(e) => setResposta(q.id, e.target.value)}
                        className="input min-h-20"
                      />
                    )}

                    {q.tipo === "numero" && (
                      <input
                        type="number"
                        required={q.obrigatoria}
                        value={(respostas[q.id] as string) ?? ""}
                        onChange={(e) => setResposta(q.id, e.target.value)}
                        className="input"
                      />
                    )}

                    {q.tipo === "data" && (
                      <input
                        type="date"
                        required={q.obrigatoria}
                        value={(respostas[q.id] as string) ?? ""}
                        onChange={(e) => setResposta(q.id, e.target.value)}
                        className="input"
                      />
                    )}

                    {q.tipo === "sim_nao" && (
                      <div className="flex gap-2">
                        {["Sim", "Não"].map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setResposta(q.id, opt)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                              respostas[q.id] === opt
                                ? "border-accent bg-accent text-white"
                                : "border-border text-muted hover:border-accent hover:text-accent"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.tipo === "unica_escolha" && (
                      <div className="flex flex-wrap gap-2">
                        {(q.opcoes ?? []).map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setResposta(q.id, opt)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              respostas[q.id] === opt
                                ? "border-accent bg-accent text-white"
                                : "border-border text-muted hover:border-accent hover:text-accent"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.tipo === "multipla_escolha" && (
                      <div className="flex flex-wrap gap-2">
                        {(q.opcoes ?? []).map((opt) => {
                          const selected = ((respostas[q.id] as string[]) ?? []).includes(opt);
                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => toggleMultipla(q.id, opt)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                selected
                                  ? "border-accent bg-accent text-white"
                                  : "border-border text-muted hover:border-accent hover:text-accent"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Sua assinatura</h2>
            <p className="mb-2 text-xs text-muted">
              Ao assinar, você confirma que as informações acima são verdadeiras.
            </p>
            <SignaturePad ref={sigRef} />
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar ficha assinada"}
          </button>
        </form>
      </div>
    </div>
  );
}
