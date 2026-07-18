import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Profile = { full_name: string | null; phone: string | null };

function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">
          স্বাগতম{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">আপনার শেখার যাত্রা এখানে থেকে শুরু।</p>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-muted-foreground">ইমেইল</h2>
              <p className="mt-1 text-base">{user?.email}</p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-muted-foreground">মোবাইল</h2>
              <p className="mt-1 text-base">{profile?.phone ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-muted-foreground">আমার কোর্স</h2>
              <p className="mt-1 text-base">শীঘ্রই আসছে</p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link
            to="/courses"
            className="inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground"
          >
            কোর্স ব্রাউজ করুন
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}