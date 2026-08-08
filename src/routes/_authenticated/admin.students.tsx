import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Search, UserX, UserCheck, Trash2, ShieldAlert } from "lucide-react";
import {
  listStudents,
  setStudentActive,
  deleteStudent,
  type AdminStudent,
} from "@/lib/admin-students.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: AdminStudents,
  head: () => ({
    meta: [
      { title: "শিক্ষার্থী ব্যবস্থাপনা | JB IT Academy" },
      { name: "description", content: "অ্যাডমিন প্যানেল থেকে শিক্ষার্থীর অ্যাকাউন্ট নিষ্ক্রিয় বা স্থায়ীভাবে মুছে ফেলুন।" },
      { property: "og:title", content: "শিক্ষার্থী ব্যবস্থাপনা | JB IT Academy" },
      { property: "og:description", content: "শিক্ষার্থীর অ্যাকাউন্ট নিষ্ক্রিয়করণ ও স্থায়ী ডিলিট ব্যবস্থাপনা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ROLE_LABEL: Record<string, string> = {
  student: "শিক্ষার্থী",
  admin: "অ্যাডমিন",
  super_admin: "সুপার অ্যাডমিন",
};

function AdminStudents() {
  const fetchStudents = useServerFn(listStudents);
  const toggleActive = useServerFn(setStudentActive);
  const removeStudent = useServerFn(deleteStudent);

  const [rows, setRows] = useState<AdminStudent[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminStudent | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<AdminStudent | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchStudents({ data: undefined });
      setRows(data);
    } catch (e) {
      setRows([]);
      toast.error(e instanceof Error ? e.message : "শিক্ষার্থী তালিকা লোড করা যায়নি।");
    }
  }, [fetchStudents]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && !r.is_active) return false;
      if (filter === "inactive" && r.is_active) return false;
      if (!needle) return true;
      return [r.full_name, r.email, r.phone, r.student_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, filter]);

  async function onToggle(row: AdminStudent, active: boolean) {
    setBusy(row.id);
    try {
      await toggleActive({ data: { userId: row.id, active } });
      toast.success(
        active
          ? `${row.full_name ?? "শিক্ষার্থী"} পুনরায় সক্রিয় করা হয়েছে।`
          : `${row.full_name ?? "শিক্ষার্থী"} নিষ্ক্রিয় করা হয়েছে — লগইন বন্ধ, তথ্য সংরক্ষিত।`,
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "কাজটি সম্পন্ন হয়নি।");
    } finally {
      setBusy(null);
      setDeactivateTarget(null);
    }
  }

  async function onDelete() {
    if (!confirmTarget) return;
    setBusy(confirmTarget.id);
    try {
      const res = await removeStudent({
        data: { userId: confirmTarget.id, confirmStudentId: confirmInput.trim() },
      });
      toast.success(
        `অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে। স্টুডেন্ট আইডি ${res.retainedStudentId ?? "—"} সংরক্ষিত থাকল, পুনরায় ব্যবহার হবে না।`,
      );
      setConfirmTarget(null);
      setConfirmInput("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ডিলিট করা যায়নি।");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">শিক্ষার্থী ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">
            অ্যাকাউন্ট নিষ্ক্রিয় করুন (তথ্য থাকবে) অথবা স্থায়ীভাবে মুছে ফেলুন। স্টুডেন্ট আইডি কখনো পুনরায় ব্যবহার হবে না।
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="নাম, ইমেইল, ফোন বা আইডি"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              filter === f ? "border-teal bg-teal text-teal-foreground" : "border-border hover:bg-secondary"
            }`}
          >
            {f === "all" ? "সব" : f === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          কোনো শিক্ষার্থী পাওয়া যায়নি।
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="px-4 py-3">স্টুডেন্ট আইডি</th>
                <th className="px-4 py-3">নাম</th>
                <th className="px-4 py-3">ইমেইল / ফোন</th>
                <th className="px-4 py-3">ভূমিকা</th>
                <th className="px-4 py-3">কোর্স</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{r.student_id ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{r.email ?? "—"}</div>
                    <div className="text-xs">{r.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">{ROLE_LABEL[r.role] ?? r.role}</td>
                  <td className="px-4 py-3">{r.enrollments}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.is_active ? "bg-green/15 text-green" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {r.is_active ? (
                        <button
                          disabled={busy === r.id || r.role !== "student"}
                          onClick={() => setDeactivateTarget(r)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                        >
                          <UserX className="h-3.5 w-3.5" /> নিষ্ক্রিয় করুন
                        </button>
                      ) : (
                        <button
                          disabled={busy === r.id}
                          onClick={() => void onToggle(r, true)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-teal px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/10 disabled:opacity-50"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> সক্রিয় করুন
                        </button>
                      )}
                      <button
                        disabled={busy === r.id || r.role !== "student"}
                        onClick={() => {
                          setConfirmTarget(r);
                          setConfirmInput("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> স্থায়ী ডিলিট
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>শিক্ষার্থী নিষ্ক্রিয় করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.full_name ?? "এই শিক্ষার্থী"} আর লগইন করতে বা কোর্সে প্রবেশ করতে পারবেন না। তবে প্রোফাইল,
              স্টুডেন্ট আইডি ({deactivateTarget?.student_id ?? "—"}), পেমেন্ট, এনরোলমেন্ট ও সার্টিফিকেট রেকর্ড অপরিবর্তিত থাকবে।
              যেকোনো সময় আবার সক্রিয় করা যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateTarget && void onToggle(deactivateTarget, false)}
            >
              হ্যাঁ, নিষ্ক্রিয় করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmTarget(null);
            setConfirmInput("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> স্থায়ীভাবে ডিলিট করবেন?
            </AlertDialogTitle>
            <AlertDialogDescription>
              এই কাজটি ফেরানো যাবে না। {confirmTarget?.full_name ?? "শিক্ষার্থীর"} অ্যাকাউন্ট ও ব্যক্তিগত তথ্য মুছে যাবে।
              পেমেন্ট ও এনরোলমেন্ট রেকর্ড আর্কাইভে সংরক্ষিত থাকবে এবং স্টুডেন্ট আইডি{" "}
              <span className="font-mono font-semibold">{confirmTarget?.student_id ?? "—"}</span> স্থায়ীভাবে রিজার্ভ
              থাকবে — কখনো পুনরায় ব্যবহার হবে না।
              <br />
              <br />
              নিশ্চিত করতে নিচে স্টুডেন্ট আইডি লিখুন।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={confirmTarget?.student_id ?? "স্টুডেন্ট আইডি"}
            className="font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                busy === confirmTarget?.id ||
                confirmInput.trim() !== (confirmTarget?.student_id ?? "\u0000")
              }
              onClick={(e) => {
                e.preventDefault();
                void onDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy === confirmTarget?.id ? "ডিলিট হচ্ছে..." : "স্থায়ীভাবে ডিলিট করুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
