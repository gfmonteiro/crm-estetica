"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RedefinirSenhaPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ocorreu um erro. Tente novamente.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="card p-6 shadow-sm text-center max-w-sm w-full">
          <p className="mb-4 text-sm text-danger">
            Link inválido. Solicite uma nova redefinição de senha.
          </p>
          <Link
            href="/login/esqueci-senha"
            className="inline-block text-sm font-medium text-accent hover:underline"
          >
            Solicitar nova redefinição
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

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
          <p className="mt-1 text-sm text-muted">Nova senha</p>
        </div>

        {success ? (
          <div className="card p-6 shadow-sm text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h2 className="mb-2 text-base font-medium text-foreground">
              Senha redefinida!
            </h2>
            <p className="mb-4 text-sm text-muted">
              Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 shadow-sm">
            <p className="mb-4 text-sm text-muted">
              Crie uma nova senha para sua conta.
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Nova senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Confirmar nova senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </button>

            <p className="mt-4 text-center text-xs text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
