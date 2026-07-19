import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

type Row = {
  id: string;
  amount: number;
  payment_method: string;
  status: "pending" | "approved" | "rejected";
  transaction_id: string | null;
  payment_date: string | null;
  admin_note: string | null;
  created_at: string;
  courses: { title: string; slug: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green/15 text-green",
  rejected: "bg-red-100 text-red-800",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "পেন্ডিং",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
};

function PaymentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payments")
      .select("id, amount, payment_method, status, transaction_id, payment_date, admin_note, created_at, courses(title, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  const filtered = rows?.filter((r) => filter === "all" || r.status === filter) ?? null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-teal" />
          <h1 className="text-2xl font-bold">পেমেন্ট ইতিহাস</h1>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                filter === s ? "border-teal bg-teal text-teal-foreground" : "border-border hover:bg-secondary"
              }`}
            >
              {s === "all" ? "সব" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {filtered === null ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            কোনো পেমেন্ট নেই। <Link to="/courses" className="text-teal hover:underline">কোর্স দেখুন</Link>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr>
                  <th className="px-4 py-3">তারিখ</th>
                  <th className="px-4 py-3">কোর্স</th>
                  <th className="px-4 py-3">মাধ্যম</th>
                  <th className="px-4 py-3">TXN ID</th>
                  <th className="px-4 py-3">পরিমাণ</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.payment_date ?? new Date(r.created_at).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.courses?.title ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{r.payment_method}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.transaction_id ?? "—"}</td>
                    <td className="px-4 py-3">৳{r.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.status === "rejected" && r.admin_note ? (
                        <div className="mt-1 text-xs text-red-700">কারণ: {r.admin_note}</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}