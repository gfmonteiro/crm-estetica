"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Sparkles,
  Wallet,
  LogOut,
  KanbanSquare,
  MessageCircle,
  Package,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import type { SessionUser } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/procedimentos", label: "Procedimentos", icon: Sparkles },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const COMING_SOON = [{ label: "Estoque", icon: Package }];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between px-5 py-5">
        <p className="font-[family-name:var(--font-display)] text-xl italic text-foreground">
          Studio<span className="text-accent not-italic">.</span>
        </p>
        <ThemeToggle />
      </div>

      <div className="px-5 pb-4">
        <p className="truncate text-xs font-medium text-muted">{user.organizationName}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className="lash-curve flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-foreground data-[active=true]:text-foreground"
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}

        <p className="mb-1 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
          Em breve
        </p>
        {COMING_SOON.map((item) => (
          <div
            key={item.label}
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted/50"
          >
            <item.icon size={17} />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
            {user.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.nome}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sair"
            className="text-muted transition-colors hover:text-danger"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
