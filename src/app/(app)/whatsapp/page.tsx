"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, Play, Info, Settings2, Clock, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/Badge";
import { AVAILABLE_WILDCARDS } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";
import type { AutomationRule, WhatsAppLogEntry } from "@/types";

interface WhatsAppSettingsView {
  phoneNumberId: string;
  accessTokenPreview: string;
  hasAccessToken: boolean;
  updatedAt: string;
}

const LOG_TONE: Record<WhatsAppLogEntry["status"], "success" | "danger" | "neutral"> = {
  enviado: "success",
  erro: "danger",
  simulado: "neutral",
};

export default function WhatsAppPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [settings, setSettings] = useState<WhatsAppSettingsView | null>(null);
  const [log, setLog] = useState<WhatsAppLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [rulesRes, settingsRes, logRes] = await Promise.all([
      fetch("/api/automation-rules"),
      fetch("/api/whatsapp/settings"),
      fetch("/api/whatsapp/log"),
    ]);
    setRules(await rulesRes.json());
    setSettings(await settingsRes.json());
    setLog(await logRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRule(rule: AutomationRule) {
    await fetch(`/api/automation-rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !rule.ativo }),
    });
    load();
  }

  async function deleteRule(id: string) {
    if (!confirm("Remover esta regra de automação?")) return;
    await fetch(`/api/automation-rules/${id}`, { method: "DELETE" });
    load();
  }

  async function runNow() {
    setRunning(true);
    setRunMessage(null);
    const res = await fetch("/api/whatsapp/run", { method: "POST" });
    const data = await res.json();
    setRunning(false);
    setRunMessage(
      data.count === 0
        ? "Nenhum atendimento bateu com as regras hoje."
        : `${data.count} mensagem(ns) processada(s) — veja o histórico abaixo.`
    );
    load();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            WhatsApp
          </h1>
          <p className="mt-1 text-sm text-muted">Mensagens automáticas após o atendimento.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsForm(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent hover:text-accent"
          >
            <Settings2 size={15} />
            Conexão
          </button>
          <button
            onClick={() => {
              setEditingRule(null);
              setShowRuleForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            Nova regra
          </button>
        </div>
      </div>

      {/* Status da conexão */}
      <div className="card mb-5 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              settings?.hasAccessToken ? "bg-success-soft text-success" : "bg-border/60 text-muted"
            }`}
          >
            {settings?.hasAccessToken ? <Check size={15} /> : <AlertTriangle size={15} />}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {settings?.hasAccessToken ? "WhatsApp Cloud API conectado" : "Nenhuma credencial configurada"}
            </p>
            <p className="text-xs text-muted">
              {settings?.hasAccessToken
                ? `Token ${settings.accessTokenPreview} · Phone Number ID ${settings.phoneNumberId}`
                : "Os disparos vão rodar em modo simulado até você conectar."}
            </p>
          </div>
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Play size={14} />
          {running ? "Executando..." : "Executar disparos de hoje"}
        </button>
      </div>

      {runMessage && (
        <p className="mb-5 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong">
          {runMessage}
        </p>
      )}

      <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Mensagens proativas (não é resposta a uma conversa ativa) só são entregues pela Meta como{" "}
          <strong>template pré-aprovado</strong>, não texto livre. O texto abaixo funciona para testar
          a lógica e o preview — antes de rodar em produção, troque pelo nome do template aprovado em{" "}
          <code className="rounded bg-border/50 px-1">src/lib/whatsapp.ts</code>.
        </p>
      </div>

      {/* Lista de regras */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-foreground">Regras de automação</h2>
      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : rules.length === 0 ? (
        <div className="card lash-curve inline-block p-8 text-sm text-muted" data-active="true">
          Nenhuma regra criada ainda. Crie a primeira para começar a enviar lembretes automáticos.
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{rule.nome}</p>
                  <Badge tone={rule.ativo ? "success" : "neutral"}>
                    {rule.ativo ? "Ativa" : "Pausada"}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Clock size={12} />
                  {rule.diasAposAtendimento === 0
                    ? "No mesmo dia do atendimento"
                    : `${rule.diasAposAtendimento} dia(s) após o atendimento`}
                </p>
                <p className="mt-1 truncate text-xs text-muted">{rule.mensagem}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                <button onClick={() => toggleRule(rule)} className="font-medium text-accent hover:underline">
                  {rule.ativo ? "Pausar" : "Ativar"}
                </button>
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setShowRuleForm(true);
                  }}
                  className="font-medium text-muted hover:text-foreground"
                >
                  Editar
                </button>
                <button onClick={() => deleteRule(rule.id)} className="font-medium text-muted hover:text-danger">
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Histórico de disparos */}
      <h2 className="mb-3 mt-8 text-sm font-semibold text-foreground">Histórico de disparos</h2>
      {log.length === 0 ? (
        <p className="text-sm text-muted">Nenhum disparo registrado ainda.</p>
      ) : (
        <div className="card divide-y divide-border">
          {log.map((entry) => (
            <div key={entry.id} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {entry.clientName} · {entry.ruleName}
                </p>
                <Badge tone={LOG_TONE[entry.status]}>{entry.status}</Badge>
              </div>
              <p className="truncate text-xs text-muted">{entry.mensagemEnviada}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDateTime(entry.createdAt)}
                {entry.detalhe ? ` · ${entry.detalhe}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {showRuleForm && (
        <RuleFormModal
          rule={editingRule}
          onClose={() => setShowRuleForm(false)}
          onSaved={() => {
            setShowRuleForm(false);
            load();
          }}
        />
      )}

      {showSettingsForm && (
        <SettingsFormModal
          current={settings}
          onClose={() => setShowSettingsForm(false)}
          onSaved={() => {
            setShowSettingsForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function RuleFormModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: AutomationRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState(rule?.nome ?? "");
  const [dias, setDias] = useState(String(rule?.diasAposAtendimento ?? 3));
  const [mensagem, setMensagem] = useState(
    rule?.mensagem ?? "Oi {{cliente}}! Passando pra saber como está o resultado do seu {{procedimento}} 💛"
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertWildcard(token: string) {
    const el = textareaRef.current;
    if (!el) {
      setMensagem((m) => `${m} ${token}`);
      return;
    }
    const start = el.selectionStart ?? mensagem.length;
    const end = el.selectionEnd ?? mensagem.length;
    const next = mensagem.slice(0, start) + token + mensagem.slice(end);
    setMensagem(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  }

  const preview = mensagem
    .replaceAll("{{cliente}}", "Beatriz")
    .replaceAll("{{procedimento}}", "Volume Brasileiro")
    .replaceAll("{{profissional}}", "Ana Studio")
    .replaceAll("{{dias}}", dias || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { nome, diasAposAtendimento: Number(dias), mensagem, ativo: rule?.ativo ?? true };
    const res = await fetch(rule ? `/api/automation-rules/${rule.id}` : "/api/automation-rules", {
      method: rule ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      <div className="card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            {rule ? "Editar regra" : "Nova regra de automação"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Nome da regra (ex.: Retorno pós-procedimento)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input"
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Enviar quantos dias após o atendimento
            </span>
            <input
              required
              type="number"
              min={0}
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="input"
            />
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Mensagem</span>
            </div>
            <textarea
              ref={textareaRef}
              required
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="input min-h-24"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {AVAILABLE_WILDCARDS.map((w) => (
                <button
                  type="button"
                  key={w.token}
                  title={w.description}
                  onClick={() => insertWildcard(w.token)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent"
                >
                  {w.token}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Pré-visualização</p>
            <div className="rounded-lg bg-success-soft px-3 py-2.5 text-sm text-foreground">
              {preview}
            </div>
          </div>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar regra"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingsFormModal({
  current,
  onClose,
  onSaved,
}: {
  current: WhatsAppSettingsView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState(current?.phoneNumberId ?? "");
  const [accessToken, setAccessToken] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/whatsapp/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId, accessToken }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar. Verifique os campos.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Conexão com o WhatsApp
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted">
          Gerada no{" "}
          <a
            href="https://developers.facebook.com/"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Meta for Developers
          </a>{" "}
          → seu app → WhatsApp → Início da API.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Phone Number ID</span>
            <input
              required
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="input"
              placeholder="ex.: 109876543210987"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Access Token {current?.hasAccessToken && "(deixe em branco para manter o atual)"}
            </span>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="input"
              placeholder={current?.accessTokenPreview || "EAAxxxxxxxx..."}
            />
          </label>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar conexão"}
          </button>
        </form>
      </div>
    </div>
  );
}
