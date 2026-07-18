import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Users, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState<{ courses: number; published: number; enrollments: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [c, p, e] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
      ]);
      setStats({ courses: c.count ?? 0, published: p.count ?? 0, enrollments: e.count ?? 0 });
    })();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
      </div>
    );
  }

  const cards = [
    { label: "মোট কোর্স", value: stats.courses, icon: BookOpen },
    { label: "প্রকাশিত কোর্স", value: stats.published, icon: DollarSign },
    { label: "মোট এনরোলমেন্ট", value: stats.enrollments, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <c.icon className="h-5 w-5 text-teal" />
            </div>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">দ্রুত কাজ</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/courses"
            className="inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90"
          >
            কোর্স ব্যবস্থাপনা
          </Link>
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            নতুন কোর্স যোগ করুন
          </Link>
        </div>
      </div>
    </div>
  );
}