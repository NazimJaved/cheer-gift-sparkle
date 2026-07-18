import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-2xl font-semibold">পাসওয়ার্ড রিসেট</h1>
        <p className="mb-6 text-sm text-muted-foreground">আপনার ইমেইল দিন, আমরা রিসেট লিঙ্ক পাঠাবো।</p>
        {sent ? (
          <div className="rounded-md bg-green/10 p-4 text-sm text-green">
            রিসেট লিঙ্ক পাঠানো হয়েছে। আপনার ইমেইল চেক করুন।
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">ইমেইল</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/40"
              />
            </label>
            {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              রিসেট লিঙ্ক পাঠান
            </button>
          </form>
        )}
        <p className="mt-6 text-sm">
          <Link to="/auth" className="text-teal hover:underline">লগইন পেজে ফিরুন</Link>
        </p>
      </div>
    </SiteLayout>
  );
}