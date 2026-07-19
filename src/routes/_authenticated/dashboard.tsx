import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import { Loader2, PlayCircle, BookOpen, ArrowRight } from "lucide-react";
import { getSignedThumbnailUrl } from "@/lib/use-admin";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Profile = { full_name: string | null; phone: string | null };
type EnrolledCourse = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  thumbnail: string | null;
  level: string | null;
  duration: string | null;
  total_lessons: number | null;
};

function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: en }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
        supabase
          .from("enrollments")
          .select("course:courses(id, slug, title, short_description, thumbnail, level, duration, total_lessons)")
          .eq("user_id", user.id),
      ]);
      setProfile(p);
      const list = ((en ?? []) as Array<{ course: EnrolledCourse | null }>)
        .map((r) => r.course)
        .filter((c): c is EnrolledCourse => !!c);
      setCourses(list);
      setLoading(false);
    })();
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
              <p className="mt-1 text-base">{courses.length} টি এনরোলড</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">আমার কোর্সসমূহ</h2>
              <Link to="/courses" className="text-sm text-teal hover:underline">
                আরও কোর্স
              </Link>
            </div>
            {courses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">আপনি এখনো কোনো কোর্সে এনরোল হননি।</p>
                <Link
                  to="/courses"
                  className="mt-4 inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground"
                >
                  কোর্স ব্রাউজ করুন
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => (
                  <EnrolledCourseCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10">
          <Link
            to="/payments"
            className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            পেমেন্ট ইতিহাস
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}

function EnrolledCourseCard({ c }: { c: EnrolledCourse }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(c.thumbnail).then(setThumb);
  }, [c.thumbnail]);
  return (
    <Link
      to="/learn/$courseSlug"
      params={{ courseSlug: c.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-teal/20 to-green/30">
        {thumb ? (
          <img src={thumb} alt={c.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <PlayCircle className="h-12 w-12 text-teal" />
        )}
        {c.level ? (
          <span className="absolute left-3 top-3 rounded-full bg-teal px-3 py-1 text-xs font-medium text-white">
            {c.level}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold group-hover:text-teal">{c.title}</h3>
        {c.short_description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.short_description}</p>
        ) : null}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{c.total_lessons ?? 0}+ লেসন</span>
          <span className="inline-flex items-center gap-1 font-medium text-teal">
            শুরু করুন <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}