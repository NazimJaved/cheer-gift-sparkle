import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

type Row = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: "pending" | "approved" | "rejected";
  transaction_id: string | null;
  sender_name: string | null;
  mobile_number: string | null;
  payment_date: string | null;
  note: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  courses: { title: string; slug: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "পেন্ডিং",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green/15 text-green",
  rejected: "bg-red-100 text-red-800",
};

function AdminPayments() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, user_id, amount, payment_method, status, transaction_id, sender_name, mobile_number, payment_date, note, admin_note, reviewed_at, created_at, courses(title, slug), profiles(full_name, phone)",
      )
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as unknown as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!needle) return true;
      return [
        r.transaction_id,
        r.sender_name,
        r.mobile_number,
        r.courses?.title,
        r.profiles?.full_name,
        r.profiles?.phone,
      ]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(needle));
    });
  }, [rows, status, q]);

  async function approve(row: Row) {
    setBusy(row.id);
    const { error } = await supabase
      .from("payments")
      .update({ status: "approved", admin_note: null })
      .eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("পেমেন্ট অনুমোদিত। শিক্ষার্থী এনরোল্ড হয়েছে।");
    load();
  }

  async function reject(row: Row) {
    const reason = window.prompt("প্রত্যাখ্যানের কারণ (অ্যাডমিন নোট):", row.admin_note ?? "");
    if (reason === null) return;
    setBusy(row.id);
    const { error } = await supabase
      .from("payments")
      .update({ status: "rejected", admin_note: reason || null })
      .eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("পেমেন্ট প্রত্যাখ্যাত।");
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">পেমেন্ট ব্যবস্থাপনা</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="খুঁজুন (TXN, নাম, মোবাইল, কোর্স)"
              className="w-72 rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">সব</option>
            <option value="pending">পেন্ডিং</option>
            <option value="approved">অনুমোদিত</option>
            <option value="rejected">প্রত্যাখ্যাত</option>
          </select>
        </div>
      </div>

      {filtered === null ? (
        <div className="mt-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          কোনো পেমেন্ট পাওয়া যায়নি।
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="px-3 py-3">তারিখ</th>
                <th className="px-3 py-3">শিক্ষার্থী</th>
                <th className="px-3 py-3">কোর্স</th>
                <th className="px-3 py-3">মাধ্যম</th>
                <th className="px-3 py-3">TXN</th>
                <th className="px-3 py-3">পাঠানো নং</th>
                <th className="px-3 py-3">পরিমাণ</th>
                <th className="px-3 py-3">স্ট্যাটাস</th>
                <th className="px-3 py-3">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-3 text-muted-foreground">
                    {r.payment_date ?? new Date(r.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.profiles?.full_name ?? r.sender_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.profiles?.phone ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3">{r.courses?.title ?? "—"}</td>
                  <td className="px-3 py-3 capitalize">{r.payment_method}</td>
                  <td className="px-3 py-3 font-mono text-xs">{r.transaction_id ?? "—"}</td>
                  <td className="px-3 py-3 font-mono text-xs">{r.mobile_number ?? "—"}</td>
                  <td className="px-3 py-3 font-semibold">৳{r.amount}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.admin_note ? <div className="mt-1 text-xs text-muted-foreground">নোট: {r.admin_note}</div> : null}
                    {r.note ? <div className="mt-1 text-xs text-muted-foreground">শিক্ষার্থী: {r.note}</div> : null}
                  </td>
                  <td className="px-3 py-3">
                    {r.status === "pending" ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => approve(r)}
                          disabled={busy === r.id}
                          className="inline-flex items-center gap-1 rounded-md bg-green px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> অনুমোদন
                        </button>
                        <button
                          onClick={() => reject(r)}
                          disabled={busy === r.id}
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> প্রত্যাখ্যান
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}