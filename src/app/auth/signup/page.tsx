"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setInfo("Check your email to confirm your account, then come back and log in.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-2xl p-6">
        <Link href="/" className="text-text-muted text-sm">← Back</Link>
        <h1 className="text-2xl font-semibold mt-4">Create your account</h1>
        <p className="text-text-muted text-sm mt-1">
          You start with $100,000 of virtual cash to trade with.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Ada Lovelace" />
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" required minLength={6} />
          {error && <p className="text-bear text-sm">{error}</p>}
          {info && <p className="text-bull text-sm">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-text-muted mt-4">
          Already have one? <Link href="/auth/login" className="text-accent">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type = "text", value, onChange, autoComplete, required, placeholder, minLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
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
        placeholder={placeholder}
        minLength={minLength}
        className="mt-1 w-full rounded-lg bg-bg-subtle border border-border focus:border-accent outline-none px-3 py-2 text-sm"
      />
    </label>
  );
}
