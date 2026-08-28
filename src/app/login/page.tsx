"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Não foi possível entrar");
      return;
    }
    const data = await res.json();
    router.push(data.role === "master" ? "/master" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* Curva-assinatura decorativa */}
      <svg
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 opacity-[0.14]"
        viewBox="0 0 820 420"
        fill="none"
      >
        <path
          d="M20 380 C 220 40, 600 40, 800 380"
          stroke="url(#grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="820" y2="0">
            <stop offset="0" stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl italic text-foreground">
            Studio<span className="text-accent not-italic">.</span>
          </p>
          <p className="mt-1 text-sm text-muted">Gestão para clínicas de estética</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 shadow-sm">
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-muted">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="mt-4 text-center text-xs text-muted">
            <a href="">Esqueceu sua Senha?</a>
          </p>
        </form>
      </div>
    </div>
  );
}
