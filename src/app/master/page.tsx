"use client";

import { useEffect, useState } from "react";
import { Plus, X, Building2, Users, Pause, Play, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/Badge";
import { formatDate } from "@/lib/format";
import type { Organization } from "@/types";

interface OrgWithCount extends Organization {
  userCount: number;
}

export default function MasterPage() {
  const [orgs, setOrgs] = useState<OrgWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [managingOrg, setManagingOrg] = useState<OrgWithCount | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/master/organizations");
    setOrgs(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(org: OrgWithCount) {
    const nextStatus = org.status === "ativo" ? "suspenso" : "ativo";
    await fetch(`/api/master/organizations/${org.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    load();
  }

  async function handleDelete(org: OrgWithCount) {
    if (
      !confirm(
        `Remover "${org.nome}" apaga TODOS os dados dela (clientes, agenda, financeiro...) permanentemente. Confirmar?`
      )
    )
      return;
    await fetch(`/api/master/organizations/${org.id}`, { method: "DELETE" });
    load();
  }

  const totalAtivos = orgs.filter((o) => o.status === "ativo").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Organizações
          </h1>
          <p className="mt-1 text-sm text-muted">
            {orgs.length} negócio(s) cadastrado(s) · {totalAtivos} ativo(s)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Nova organização
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : orgs.length === 0 ? (
        <div className="card lash-curve inline-block p-8 text-sm text-muted" data-active="true">
          Nenhuma organização cadastrada ainda. Crie a primeira para liberar acesso a um cliente.
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {orgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <Building2 size={17} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{org.nome}</p>
                  <p className="truncate text-xs text-muted">
                    {org.tipoNegocio} · {org.email} · desde {formatDate(org.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
                <Users size={13} />
                {org.userCount}
              </div>

              <Badge tone={org.status === "ativo" ? "success" : "danger"}>{org.status}</Badge>

              <div className="flex shrink-0 items-center gap-3 text-xs">
                <button
                  onClick={() => setManagingOrg(org)}
                  title="Gerenciar usuários"
                  className="flex items-center gap-1 font-medium text-muted hover:text-accent"
                >
                  <UserPlus size={13} />
                  Usuários
                </button>
                <button
                  onClick={() => toggleStatus(org)}
                  className="flex items-center gap-1 font-medium text-muted hover:text-foreground"
                >
                  {org.status === "ativo" ? <Pause size={13} /> : <Play size={13} />}
                  {org.status === "ativo" ? "Suspender" : "Reativar"}
                </button>
                <button
                  onClick={() => handleDelete(org)}
                  className="flex items-center gap-1 font-medium text-muted hover:text-danger"
                >
                  <Trash2 size={13} />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NewOrganizationModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {managingOrg && (
        <ManageUsersModal organization={managingOrg} onClose={() => setManagingOrg(null)} />
      )}
    </div>
  );
}

function NewOrganizationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    tipoNegocio: "Lash Designer",
    email: "",
    telefone: "",
    plano: "",
    ownerNome: "",
    ownerEmail: "",
    ownerPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/master/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] || data.error || "Não foi possível criar. Confira os campos.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
            Nova organização
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Dados do negócio
            </h3>
            <div className="space-y-3">
              <input
                required
                placeholder="Nome do negócio"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="input"
              />
              <select
                value={form.tipoNegocio}
                onChange={(e) => setForm((f) => ({ ...f, tipoNegocio: e.target.value }))}
                className="input"
              >
                <option>Lash Designer</option>
                <option>Clínica de Estética</option>
                <option>Nail Designer</option>
                <option>Studio de Sobrancelhas</option>
                <option>Salão de Beleza</option>
                <option>Outro</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="email"
                  placeholder="E-mail de contato"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input"
                />
                <input
                  placeholder="Telefone"
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                  className="input"
                />
              </div>
              <input
                placeholder="Plano (opcional)"
                value={form.plano}
                onChange={(e) => setForm((f) => ({ ...f, plano: e.target.value }))}
                className="input"
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Acesso do responsável (login que ele vai usar)
            </h3>
            <div className="space-y-3">
              <input
                required
                placeholder="Nome do responsável"
                value={form.ownerNome}
                onChange={(e) => setForm((f) => ({ ...f, ownerNome: e.target.value }))}
                className="input"
              />
              <input
                required
                type="email"
                placeholder="E-mail de login"
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                className="input"
              />
              <input
                required
                type="password"
                placeholder="Senha inicial (mín. 6 caracteres)"
                value={form.ownerPassword}
                onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
                className="input"
              />
            </div>
          </section>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Criando..." : "Criar organização e acesso"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface OrgUser {
  id: string;
  nome: string;
  email: string;
  role: string;
  createdAt: string;
}

function ManageUsersModal({
  organization,
  onClose,
}: {
  organization: OrgWithCount;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/master/organizations/${organization.id}/users`);
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
              Usuários — {organization.nome}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : (
          <div className="mb-4 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{u.nome}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
                <Badge tone="accent">{u.role}</Badge>
              </div>
            ))}
          </div>
        )}

        {showAddUser ? (
          <AddUserForm
            organizationId={organization.id}
            onDone={() => {
              setShowAddUser(false);
              load();
            }}
          />
        ) : (
          <button
            onClick={() => setShowAddUser(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-muted hover:border-accent hover:text-accent"
          >
            <UserPlus size={15} />
            Adicionar usuário
          </button>
        )}
      </div>
    </div>
  );
}

function AddUserForm({ organizationId, onDone }: { organizationId: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", password: "", role: "profissional" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/master/organizations/${organizationId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Não foi possível adicionar.");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-4">
      <input
        required
        placeholder="Nome"
        value={form.nome}
        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        className="input"
      />
      <input
        required
        type="email"
        placeholder="E-mail de login"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="input"
      />
      <input
        required
        type="password"
        placeholder="Senha (mín. 6 caracteres)"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        className="input"
      />
      <select
        value={form.role}
        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        className="input"
      >
        <option value="profissional">Profissional</option>
        <option value="admin">Admin</option>
      </select>
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Adicionar"}
      </button>
    </form>
  );
}
