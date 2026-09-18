"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Generic customer signup. Barber signup happens inside the /join
// wizard (step 1) so it can pass role: "barber" in the same call.
export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "customer", full_name: fullName, phone } }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <h1 className="mb-6 text-xl font-semibold">Create your account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none" />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none" />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="rounded-full bg-accent px-4 py-3 text-sm font-medium text-accentInk disabled:opacity-60">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
