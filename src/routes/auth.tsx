import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <SiteLayout>
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="mb-6 grid grid-cols-2 rounded-lg border border-border p-1 text-sm font-medium">
          <button
            onClick={() => setMode("login")}
            className={`rounded-md px-3 py-2 transition ${mode === "login" ? "bg-teal text-teal-foreground" : "text-muted-foreground"}`}
          >
            লগইন
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-md px-3 py-2 transition ${mode === "register" ? "bg-teal text-teal-foreground" : "text-muted-foreground"}`}
          >
            রেজিস্ট্রেশন
          </button>
        </div>
        {mode === "login" ? <LoginForm /> : <RegisterForm onDone={() => setMode("login")} />}
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/40"
      />
    </label>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" : error.message);
      return;
    }
    await router.invalidate();
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">স্বাগতম</h1>
      <p className="text-sm text-muted-foreground">আপনার অ্যাকাউন্টে লগইন করুন।</p>
      <Field label="ইমেইল" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="পাসওয়ার্ড" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        লগইন করুন
      </button>
      <div className="flex justify-between text-sm">
        <Link to="/forgot-password" className="text-teal hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
      </div>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 6) return setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
    if (password !== confirm) return setError("পাসওয়ার্ড মিলছে না।");
    if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(phone.replace(/\s|-/g, ""))) {
      return setError("সঠিক বাংলাদেশি মোবাইল নম্বর দিন।");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSuccess("রেজিস্ট্রেশন সফল! আপনার ইমেইলে যাচাইকরণ লিঙ্ক পাঠানো হয়েছে।");
    setTimeout(onDone, 2500);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">অ্যাকাউন্ট তৈরি করুন</h1>
      <p className="text-sm text-muted-foreground">শেখা শুরু করতে রেজিস্ট্রেশন করুন।</p>
      <Field label="পূর্ণ নাম" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <Field label="মোবাইল নম্বর" placeholder="01XXXXXXXXX" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Field label="ইমেইল" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="পাসওয়ার্ড" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field label="পাসওয়ার্ড নিশ্চিত করুন" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="rounded-md bg-green/10 px-3 py-2 text-sm text-green">{success}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        রেজিস্ট্রেশন করুন
      </button>
    </form>
  );
}