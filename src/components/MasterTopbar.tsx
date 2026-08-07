"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import type { SessionUser } from "@/types";

export function MasterTopbar({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-8 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
          <ShieldCheck size={16} />
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg leading-none text-foreground">
            Studio<span className="text-accent">.</span> Master
          </p>
          <p className="text-xs text-muted">Painel do administrador da plataforma</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">{user.nome}</span>
          <button onClick={handleLogout} className="text-muted transition-colors hover:text-danger">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
