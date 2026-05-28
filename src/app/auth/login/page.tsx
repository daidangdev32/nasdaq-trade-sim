"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// useSearchParams must be inside a <Suspense> boundary during static prerender.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-2xl p-6">
        <Link href="/" className="text-text-muted text-sm">← Back</Link>
        <h1 className="text-2xl font-semibold mt-4">Welcome back</h1>
        <p className="text-text-muted text-sm mt-1">Log in to your trading account.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
          {error && <p className="text-bear text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-text-muted mt-4">
          New here? <Link href="/auth/signup" className="text-accent">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, autoComplete, required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="mt-1 w-full rounded-lg bg-bg-subtle border border-border focus:border-accent outline-none px-3 py-2 text-sm"
      />
    </label>
  );
}
