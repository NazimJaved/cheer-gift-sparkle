import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, ArrowLeft, PlayCircle, CheckCircle2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { extractYouTubeId, type Lesson } from "@/lib/lessons";

export const Route = createFileRoute("/_authenticated/learn/$courseSlug")({
  component: LearnCourseIndex,
});

type CourseInfo = { id: string; title: string; price: number; discount_price: number | null };

function LearnCourseIndex() {
  const { courseSlug } = Route.useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [resumeLessonSlug, setResumeLessonSlug] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c, error } = await supabase
        .from("courses")
        .select("id,title,price,discount_price")
        .eq("slug", courseSlug)
        .eq("published", true)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (!c) {
        setLoading(false);
        return;
      }
      setCourse(c);

      if (user) {
        const { data: e } = await supabase
          .from("enrollments")
          .select("id")
          .eq("course_id", c.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setEnrolled(!!e);

        // Resume: last watched incomplete lesson
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("lesson_id, last_watched_at, completed")
          .eq("user_id", user.id)
          .eq("course_id", c.id)
          .order("last_watched_at", { ascending: false });
        const last = progress?.[0];
        if (last?.lesson_id) {
          const { data: lastLesson } = await supabase
            .from("lessons")
            .select("slug")
            .eq("id", last.lesson_id)
            .maybeSingle();
          if (lastLesson) setResumeLessonSlug(lastLesson.slug);
        }
        setCompletedIds(new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id)));
      }

      const { data: ls } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", c.id)
        .eq("is_published", true)
        .order("lesson_order", { ascending: true });
      setLessons((ls ?? []) as Lesson[]);
      // pick initial preview: resume lesson if available, else first
      const initial = (ls ?? []).find((x) => x.slug === (resumeLessonSlug ?? "")) ?? (ls ?? [])[0];
      if (initial) setActiveLessonId(initial.id);
      setLoading(false);
    })();
  }, [courseSlug, user]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      </SiteLayout>
    );
  }

  if (!course) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">কোর্স পাওয়া যায়নি</h1>
          <Link to="/courses" className="mt-6 inline-flex items-center gap-2 text-teal hover:underline">
            <ArrowLeft className="h-4 w-4" /> সব কোর্স
          </Link>
        </div>
      </SiteLayout>
    );
  }

  if (!enrolled) {
    return <PurchaseView course={course} />;
  }

  if (lessons.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">এখনও লেসন প্রকাশিত হয়নি</h1>
          <p className="mt-2 text-muted-foreground">শীঘ্রই লেসন যুক্ত করা হবে।</p>
        </div>
      </SiteLayout>
    );
  }

  const resumeTarget = resumeLessonSlug ?? lessons[0].slug;
  const done = completedIds.size;
  const total = lessons.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0];
  const activeVideoId = activeLesson ? extractYouTubeId(activeLesson.youtube_url) : null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link
          to="/courses/$slug"
          params={{ slug: courseSlug }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> কোর্স বিবরণ
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{course.title}</h1>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">কোর্স প্রগ্রেস</span>
            <span className="text-muted-foreground">{done}/{total}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-teal transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4">
            <Link
              to="/learn/$courseSlug/$lessonSlug"
              params={{ courseSlug, lessonSlug: resumeTarget }}
              className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90"
            >
              <PlayCircle className="h-4 w-4" />
              {resumeLessonSlug ? "চালিয়ে যান" : "শুরু করুন"}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="order-2 lg:order-1">
            <h2 className="mb-3 text-lg font-bold">সব লেসন</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {lessons.map((l, i) => {
            const isDone = completedIds.has(l.id);
            const isActive = activeLesson?.id === l.id;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setActiveLessonId(l.id)}
                  className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-secondary ${
                    isActive ? "bg-teal/5" : ""
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-semibold ${
                      isActive ? "bg-teal text-teal-foreground" : "bg-secondary"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {l.duration && <span>{l.duration}</span>}
                      {l.is_free_preview && (
                        <span className="inline-flex items-center gap-0.5 text-green">
                          <Sparkles className="h-3 w-3" /> প্রিভিউ
                        </span>
                      )}
                    </div>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-green" />
                  ) : (
                    <PlayCircle className={`h-5 w-5 ${isActive ? "text-teal" : "text-muted-foreground"}`} />
                  )}
                </button>
              </li>
            );
          })}
            </ul>
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-950 to-black p-2 shadow-[0_30px_80px_-20px_rgba(20,184,166,0.45)]">
              <div className="pointer-events-none absolute -inset-16 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(20,184,166,0.35),transparent_70%)]" />
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                {activeVideoId ? (
                  <>
                    <iframe
                      key={activeVideoId}
                      src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0&modestbranding=1&showinfo=0&controls=1&iv_load_policy=3&fs=1&playsinline=1&disablekb=1&color=white`}
                      title={activeLesson?.title ?? "lesson"}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                    {/* Cover YouTube logo (bottom-right) and title bar (top) */}
                    <div className="pointer-events-none absolute right-0 bottom-0 h-10 w-28 bg-black" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black to-transparent" />
                    {/* Cover share/watch-on-YouTube buttons in top-right */}
                    <div className="pointer-events-none absolute right-0 top-0 h-12 w-40 bg-black" />
                  </>
                ) : (
                  <div className="grid h-full w-full place-items-center text-center text-sm text-white/70">
                    <div>
                      <PlayCircle className="mx-auto h-10 w-10 text-white/40" />
                      <p className="mt-2">ভিডিও পাওয়া যায়নি</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative flex items-start justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-teal">এখন দেখছেন</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white">
                    {activeLesson?.title ?? "—"}
                  </p>
                </div>
                {activeLesson && (
                  <Link
                    to="/learn/$courseSlug/$lessonSlug"
                    params={{ courseSlug, lessonSlug: activeLesson.slug }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-teal-foreground hover:bg-teal/90"
                  >
                    ফুল ভিউ <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function PurchaseView({ course }: { course: CourseInfo }) {
  const finalPrice = course.discount_price ?? course.price;
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-teal/5 via-background to-green/10 p-8 shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-teal/15 text-teal">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-bold">এনরোলমেন্ট প্রয়োজন</h1>
          <p className="mt-2 text-muted-foreground">
            "{course.title}" কোর্সের লেসন দেখার জন্য এনরোল হতে হবে।
          </p>

          <div className="mt-6 flex items-end gap-3">
            {course.discount_price != null ? (
              <>
                <span className="text-3xl font-bold text-green">৳{course.discount_price}</span>
                <span className="text-lg text-muted-foreground line-through">৳{course.price}</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-green">৳{finalPrice}</span>
            )}
          </div>

          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <PlayCircle className="mt-0.5 h-4 w-4 text-teal" /> লাইফটাইম কোর্স অ্যাক্সেস
            </li>
            <li className="flex items-start gap-2">
              <PlayCircle className="mt-0.5 h-4 w-4 text-teal" /> সকল ভিডিও লেসন ও রিসোর্স
            </li>
            <li className="flex items-start gap-2">
              <PlayCircle className="mt-0.5 h-4 w-4 text-teal" /> সার্টিফিকেট (কোর্স সম্পন্ন করলে)
            </li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90"
            >
              এনরোলমেন্টের জন্য যোগাযোগ করুন
            </Link>
            <Link
              to="/courses/$slug"
              params={{ slug: courseFallbackSlug() }}
              className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm hover:bg-secondary"
            >
              কোর্স বিবরণ দেখুন
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            অ্যাডমিন আপনাকে এনরোল করলেই লেসন উন্মুক্ত হবে।
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

function courseFallbackSlug() {
  // read the courseSlug param from window location as a fallback for Link typing
  if (typeof window !== "undefined") {
    const parts = window.location.pathname.split("/");
    return parts[2] ?? "";
  }
  return "";
}