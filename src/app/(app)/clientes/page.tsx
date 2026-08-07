"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Phone } from "lucide-react";
import { Badge } from "@/components/Badge";
import type { Client } from "@/types";

const STATUS_TONE = {
  ativo: "success",
  inativo: "neutral",
  bloqueado: "danger",
} as const;

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 250);
    return () => clearTimeout(timeout);
  }, [query, load]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted">{clients.length} cliente(s) encontrado(s)</p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted">Carregando...</p>
        ) : clients.length === 0 ? (
          <div className="lash-curve inline-block p-8 text-sm text-muted" data-active="true">
            Nenhum cliente encontrado. Que tal cadastrar o primeiro?
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Contato</th>
                <th className="px-5 py-3 font-medium">Origem</th>
                <th className="px-5 py-3 font-medium">Tags</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-accent-soft/40"
                >
                  <td className="px-5 py-3">
                    <Link href={`/clientes/${c.id}`} className="font-medium text-foreground hover:text-accent">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} />
                      {c.whatsapp || c.telefone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.origem || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} tone="accent">
                          {tag}
                        </Badge>
                      ))}
                      {c.tags.length > 2 && (
                        <Badge tone="neutral">+{c.tags.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
