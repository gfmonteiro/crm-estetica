"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import { formatDateTime } from "@/lib/format";
import type { AnamnesisForm, AnamnesisResponse } from "@/types";

export default function RespostaPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<AnamnesisForm | null>(null);
  const [response, setResponse] = useState<AnamnesisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sigRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/anamnesis-responses/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data.form);
        setResponse(data.response);
        setLoading(false);
      });
  }, [id]);

  async function handleSign() {
    if (!id) return;
    const dataUrl = sigRef.current?.getDataUrl();
    if (!dataUrl) {
      setError("Assine no quadro antes de confirmar.");
      return;
    }
    setSigning(true);
    setError(null);
    const res = await fetch(`/api/anamnesis-responses/${id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assinaturaDataUrl: dataUrl }),
    });
    setSigning(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Não foi possível assinar.");
      return;
    }
    setResponse(await res.json());
  }

  if (loading || !form || !response) return <p className="text-sm text-muted">Carregando...</p>;

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <Link href={`/fichas/${form.id}`} className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Voltar para {form.nome}
      </Link>

      <div className="card mb-5 p-6">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl text-foreground">
            {response.respondenteNome || "Sem nome"}
          </h1>
          <Badge
            tone={response.status === "concluida" ? "success" : response.status === "assinada_cliente" ? "accent" : "neutral"}
          >
            {response.status === "concluida"
              ? "Concluída"
              : response.status === "assinada_cliente"
                ? "Aguardando sua assinatura"
                : "Pendente"}
          </Badge>
        </div>
        {response.respondenteTelefone && (
          <p className="text-xs text-muted">{response.respondenteTelefone}</p>
        )}
        <p className="mt-1 text-xs text-muted">Enviado em {formatDateTime(response.createdAt)}</p>
      </div>

      {response.status === "pendente" ? (
        <div className="card p-6 text-sm text-muted">
          A cliente ainda não preencheu esta ficha. Assim que ela responder e assinar, a opção pra você
          assinar aparece aqui.
        </div>
      ) : (
        <>
          <div className="card mb-5 divide-y divide-border">
            {form.categorias.map((cat) => (
              <div key={cat.id} className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{cat.nome}</h3>
                <div className="space-y-3">
                  {cat.perguntas.map((q) => {
                    const resposta = response.respostas[q.id];
                    return (
                      <div key={q.id}>
                        <p className="text-xs text-muted">{q.texto}</p>
                        <p className="text-sm text-foreground">
                          {Array.isArray(resposta) ? resposta.join(", ") : resposta || "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-5 p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Assinatura da cliente</h3>
            {response.assinaturaClienteDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={response.assinaturaClienteDataUrl}
                alt="Assinatura da cliente"
                className="h-32 rounded-lg border border-border bg-white"
              />
            )}
            <p className="mt-1 text-xs text-muted">
              Assinado em {response.assinaturaClienteEm && formatDateTime(response.assinaturaClienteEm)}
            </p>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <PenLine size={15} />
              Sua assinatura
            </h3>

            {response.status === "concluida" ? (
              <>
                {response.assinaturaProfissionalDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={response.assinaturaProfissionalDataUrl}
                    alt="Assinatura da profissional"
                    className="h-32 rounded-lg border border-border bg-white"
                  />
                )}
                <p className="mt-1 text-xs text-muted">
                  Assinado por {response.assinaturaProfissionalPor} em{" "}
                  {response.assinaturaProfissionalEm && formatDateTime(response.assinaturaProfissionalEm)}
                </p>
              </>
            ) : (
              <div>
                <SignaturePad ref={sigRef} />
                {error && <p className="mt-2 text-sm text-danger">{error}</p>}
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="mt-3 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {signing ? "Assinando..." : "Confirmar assinatura e concluir ficha"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
