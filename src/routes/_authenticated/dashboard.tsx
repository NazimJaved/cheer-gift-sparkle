import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2,
  PlayCircle,
  BookOpen,
  ArrowRight,
  Clock,
  Trophy,
  Heart,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { getSignedThumbnailUrl } from "@/lib/use-admin";
import { useEnrolledCoursesProgress, useRecentLessons, type CourseProgress } from "@/lib/db-progress";
import { usePublishedCourses } from "@/lib/db-courses";
import { useWishlistIds } from "@/lib/db-wishlist";

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
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const progressList = useEnrolledCoursesProgress();
  const recent = useRecentLessons(6);
  const allCourses = usePublishedCourses();
  const { ids: wishlistIds } = useWishlistIds();

  const loading = progressList === null;
  const active = (progressList ?? []).filter((p) => p.totalLessons === 0 || p.percent < 100);
  const completed = (progressList ?? []).filter((p) => p.totalLessons > 0 && p.percent === 100);
  const continueItem = [...(progressList ?? [])].sort((a, b) =>
    (b.lastWatchedAt ?? "").localeCompare(a.lastWatchedAt ?? ""),
  )[0];
  const enrolledIds = new Set((progressList ?? []).map((p) => p.course.id));
  const recommended = (allCourses ?? [])
    .filter((c) => !enrolledIds.has(c.id) && !wishlistIds.has(c.id))
    .slice(0, 3);
  const wishlistCourses = (allCourses ?? []).filter((c) => wishlistIds.has(c.id)).slice(0, 3);

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
          <>
            {continueItem ? (
              <ContinueLearningCard p={continueItem} />
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">আপনি এখনো কোনো কোর্সে এনরোল হননি।</p>
                <Link
                  to="/courses"
                  className="mt-4 inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground"
                >
                  কোর্স ব্রাউজ করুন
                </Link>
              </div>
            )}

            {active.length > 0 && (
              <Section title="চলমান কোর্স" seeAll={{ to: "/courses", label: "আরও কোর্স" }}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((p) => (
                    <EnrolledCourseCard key={p.course.id} p={p} />
                  ))}
                </div>
              </Section>
            )}

            {recent && recent.length > 0 && (
              <Section title="সাম্প্রতিক দেখা লেসন">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recent.map((r) => (
                    <Link
                      key={r.lesson_id}
                      to="/learn/$courseSlug/$lessonSlug"
                      params={{ courseSlug: r.course_slug, lessonSlug: r.lesson_slug }}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-md"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
                        {r.completed ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.lesson_title}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.course_title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {completed.length > 0 && (
              <Section title="সম্পন্ন কোর্স">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {completed.map((p) => (
                    <EnrolledCourseCard key={p.course.id} p={p} />
                  ))}
                </div>
              </Section>
            )}

            {wishlistCourses.length > 0 && (
              <Section title="উইশলিস্ট" seeAll={{ to: "/wishlist", label: "সব দেখুন" }}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {wishlistCourses.map((c) => (
                    <RecommendedCard
                      key={c.id}
                      id={c.id}
                      slug={c.slug}
                      title={c.title}
                      short={c.short_description}
                      thumbnail={c.thumbnail}
                    />
                  ))}
                </div>
              </Section>
            )}

            {recommended.length > 0 && (
              <Section title="আপনার জন্য সাজেশন">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((c) => (
                    <RecommendedCard
                      key={c.id}
                      id={c.id}
                      slug={c.slug}
                      title={c.title}
                      short={c.short_description}
                      thumbnail={c.thumbnail}
                    />
                  ))}
                </div>
              </Section>
            )}

            <div className="mt-10 flex flex-wrap gap-2">
              <Link
                to="/payments"
                className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                পেমেন্ট ইতিহাস
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                প্রোফাইল
              </Link>
              <span className="hidden text-xs text-muted-foreground sm:inline">{profile?.phone ? `📱 ${profile.phone}` : ""}</span>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

function Section({
  title,
  seeAll,
  children,
}: {
  title: string;
  seeAll?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        {seeAll && (
          <Link to={seeAll.to} className="text-sm text-teal hover:underline">
            {seeAll.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function ContinueLearningCard({ p }: { p: CourseProgress }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(p.course.thumbnail).then(setThumb);
  }, [p.course.thumbnail]);
  const target = p.lastLessonSlug
    ? { to: "/learn/$courseSlug/$lessonSlug" as const, params: { courseSlug: p.course.slug, lessonSlug: p.lastLessonSlug } }
    : { to: "/learn/$courseSlug" as const, params: { courseSlug: p.course.slug } };
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-teal/10 via-background to-green/10 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-teal/30 to-green/30 md:aspect-auto">
          {thumb ? <img src={thumb} alt={p.course.title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex flex-col justify-center p-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-teal">চালিয়ে যান</span>
          <h3 className="mt-1 text-xl font-bold">{p.course.title}</h3>
          {p.lastLessonTitle && (
            <p className="mt-1 text-sm text-muted-foreground">সর্বশেষ: {p.lastLessonTitle}</p>
          )}
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-teal transition-all" style={{ width: `${p.percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.completedCount}/{p.totalLessons} লেসন • {p.percent}%
              {p.remainingMinutes ? ` • প্রায় ${p.remainingMinutes} মিনিট বাকি` : ""}
            </p>
          </div>
          <div className="mt-4">
            <Link
              {...target}
              className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90"
            >
              <PlayCircle className="h-4 w-4" /> {p.lastLessonSlug ? "চালিয়ে যান" : "শুরু করুন"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrolledCourseCard({ p }: { p: CourseProgress }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(p.course.thumbnail).then(setThumb);
  }, [p.course.thumbnail]);
  const c = p.course;
  const done = p.percent === 100;
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
        {done && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-green px-3 py-1 text-xs font-medium text-white">
            <Trophy className="h-3 w-3" /> সম্পন্ন
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold group-hover:text-teal">{c.title}</h3>
        {c.short_description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.short_description}</p>
        ) : null}
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-teal transition-all" style={{ width: `${p.percent}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{p.completedCount}/{p.totalLessons} লেসন • {p.percent}%</span>
            {p.remainingMinutes ? (
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{p.remainingMinutes} মিনিট</span>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-teal">
            {done ? "রিভিউ করুন" : "চালিয়ে যান"} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function RecommendedCard({
  slug,
  title,
  short,
  thumbnail,
}: {
  id: string;
  slug: string;
  title: string;
  short: string | null;
  thumbnail: string | null;
}) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(thumbnail).then(setThumb);
  }, [thumbnail]);
  return (
    <Link
      to="/courses/$slug"
      params={{ slug }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-teal/20 to-green/30">
        {thumb && <img src={thumb} alt={title} className="h-full w-full object-cover" />}
      </div>
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-teal">{title}</h3>
        {short && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{short}</p>}
      </div>
    </Link>
  );
}