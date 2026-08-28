import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CalendarClock, Wallet, TrendingUp, Cake, XCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { proceduresRepository } from "@/lib/db/repositories/procedures";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatTime } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.organizationId) redirect("/login");
  const orgId = session.organizationId;

  const stats = await getDashboardStats(orgId);
  const clients = await clientsRepository.findAll(orgId);
  const procedures = await proceduresRepository.findAll(orgId);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const procedureById = new Map(procedures.map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
          Visão geral
        </h1>
        <p className="mt-1 text-sm text-muted">O que está acontecendo no seu negócio hoje.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Clientes ativos"
          value={String(stats.activeClients)}
          icon={Users}
          hint={`${stats.totalClients} cadastrados no total`}
        />
        <KpiCard
          label="Atendimentos hoje"
          value={String(stats.appointmentsTodayCount)}
          icon={CalendarClock}
        />
        <KpiCard
          label="Faturamento do mês"
          value={formatCurrency(stats.revenueMonth)}
          icon={Wallet}
          hint={`Despesas: ${formatCurrency(stats.expensesMonth)}`}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(stats.ticketMedio)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Novos clientes"
          value={String(stats.newClientsThisMonth)}
          icon={Users}
          hint="neste mês"
        />
        <KpiCard
          label="Aniversariantes"
          value={String(stats.aniversariantesCount)}
          icon={Cake}
          hint="nos próximos 30 dias"
        />
        <KpiCard
          label="Taxa de cancelamento"
          value={`${stats.taxaCancelamento.toFixed(1)}%`}
          icon={XCircle}
          hint="neste mês"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
              Agenda de hoje
            </h2>
            <Link href="/agenda" className="text-xs font-medium text-accent hover:underline">
              Ver agenda completa
            </Link>
          </div>

          {stats.appointmentsToday.length === 0 ? (
            <EmptyState message="Nenhum atendimento agendado para hoje." />
          ) : (
            <ul className="space-y-2">
              {stats.appointmentsToday.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {clientById.get(a.clientId)?.nome ?? "Cliente removido"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {procedureById.get(a.procedureId)?.nome ?? "Procedimento"} · {a.profissional}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
                    {formatTime(a.startAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-foreground">
              Próximos agendamentos
            </h2>
          </div>

          {stats.upcoming.length === 0 ? (
            <EmptyState message="Nenhum agendamento futuro por enquanto." />
          ) : (
            <ul className="space-y-2">
              {stats.upcoming.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {clientById.get(a.clientId)?.nome ?? "Cliente removido"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {procedureById.get(a.procedureId)?.nome ?? "Procedimento"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(a.startAt).toLocaleDateString("pt-BR")} ·{" "}
                    {formatTime(a.startAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="lash-curve inline-block py-6 text-center text-sm text-muted" data-active="true">
      {message}
    </div>
  );
}
