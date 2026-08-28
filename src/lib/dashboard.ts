import { clientsRepository } from "@/lib/db/repositories/clients";
import { appointmentsRepository } from "@/lib/db/repositories/appointments";
import { transactionsRepository } from "@/lib/db/repositories/transactions";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function getDashboardStats(organizationId: string) {
  const clients = await clientsRepository.findAll(organizationId);
  const appointments = await appointmentsRepository.findAll(organizationId);
  const transactions = await transactionsRepository.findAll(organizationId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const appointmentsToday = appointments
    .filter((a) => isSameDay(new Date(a.startAt), now))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const upcoming = appointments
    .filter((a) => new Date(a.startAt) > now && a.status !== "cancelado")
    .slice(0, 5);

  const monthTransactions = transactions.filter((t) => new Date(t.data) >= startOfMonth);
  const revenueMonth = monthTransactions
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);
  const expensesMonth = monthTransactions
    .filter((t) => t.tipo === "despesa")
    .reduce((sum, t) => sum + t.valor, 0);

  const completedThisMonth = appointments.filter(
    (a) => a.status === "compareceu" && new Date(a.startAt) >= startOfMonth
  );
  const canceledThisMonth = appointments.filter(
    (a) =>
      (a.status === "cancelado" || a.status === "faltou") &&
      new Date(a.startAt) >= startOfMonth
  );
  const totalThisMonth = appointments.filter((a) => new Date(a.startAt) >= startOfMonth);

  const ticketMedio = completedThisMonth.length > 0 ? revenueMonth / completedThisMonth.length : 0;
  const taxaCancelamento =
    totalThisMonth.length > 0 ? (canceledThisMonth.length / totalThisMonth.length) * 100 : 0;

  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const aniversariantes = clients.filter((c) => {
    if (!c.dataNascimento) return false;
    const bd = new Date(c.dataNascimento);
    const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    return thisYearBd >= now && thisYearBd <= in30Days;
  });

  const newClientsThisMonth = clients.filter((c) => new Date(c.createdAt) >= startOfMonth);

  return {
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "ativo").length,
    newClientsThisMonth: newClientsThisMonth.length,
    appointmentsTodayCount: appointmentsToday.length,
    revenueMonth,
    expensesMonth,
    ticketMedio,
    taxaCancelamento,
    upcoming,
    appointmentsToday,
    aniversariantesCount: aniversariantes.length,
  };
}
