import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { useEnrolledCoursesProgress, type CourseProgress } from "@/lib/db-progress";
import { getSignedThumbnailUrl } from "@/lib/use-admin";
import { BookOpen, Clock, Loader2, PlayCircle, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-courses")({
  head: () => ({
    meta: [
      { title: "আমার কোর্স — JB IT Academy" },
      { name: "description", content: "আপনার এনরোল করা সকল কোর্স এক জায়গায়।" },
      { property: "og:title", content: "আমার কোর্স — JB IT Academy" },
      { property: "og:description", content: "আপনার এনরোল করা সকল কোর্স এক জায়গায়।" },
    ],
  }),
  component: MyCoursesPage,
});

function MyCoursesPage() {
  const progressList = useEnrolledCoursesProgress();
  const loading = progressList === null;
  const items = progressList ?? [];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">আমার কোর্স</h1>
        <p className="mt-2 text-muted-foreground">
          আপনার এনরোল করা কোর্সগুলো এখানে দেখুন এবং যেখানে থেমেছিলেন সেখান থেকে শুরু করুন।
        </p>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : items.length === 0 ? (
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
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <MyCourseCard key={p.course.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function MyCourseCard({ p }: { p: CourseProgress }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(p.course.thumbnail).then(setThumb);
  }, [p.course.thumbnail]);
  const c = p.course;
  const done = p.totalLessons > 0 && p.percent === 100;
  const target = p.lastLessonSlug
    ? {
        to: "/learn/$courseSlug/$lessonSlug" as const,
        params: { courseSlug: c.slug, lessonSlug: p.lastLessonSlug },
      }
    : { to: "/learn/$courseSlug" as const, params: { courseSlug: c.slug } };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
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
            <span>
              {p.completedCount}/{p.totalLessons} লেসন • {p.percent}%
            </span>
            {p.remainingMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {p.remainingMinutes} মিনিট
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <Link
            {...target}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90"
          >
            <PlayCircle className="h-4 w-4" /> কোর্স চালিয়ে যান
          </Link>
        </div>
      </div>
    </div>
  );
}