import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, ArrowLeft, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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
  const [firstLessonSlug, setFirstLessonSlug] = useState<string | null>(null);
  const [resumeLessonSlug, setResumeLessonSlug] = useState<string | null>(null);

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
          .select("lesson_id, last_watched_at")
          .eq("user_id", user.id)
          .eq("course_id", c.id)
          .order("last_watched_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (progress?.lesson_id) {
          const { data: lastLesson } = await supabase
            .from("lessons")
            .select("slug")
            .eq("id", progress.lesson_id)
            .maybeSingle();
          if (lastLesson) setResumeLessonSlug(lastLesson.slug);
        }
      }

      const { data: first } = await supabase
        .from("lessons")
        .select("slug")
        .eq("course_id", c.id)
        .eq("is_published", true)
        .order("lesson_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      setFirstLessonSlug(first?.slug ?? null);
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

  const target = resumeLessonSlug ?? firstLessonSlug;
  if (!target) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">এখনও লেসন প্রকাশিত হয়নি</h1>
          <p className="mt-2 text-muted-foreground">শীঘ্রই লেসন যুক্ত করা হবে।</p>
        </div>
      </SiteLayout>
    );
  }
  return (
    <Navigate
      to="/learn/$courseSlug/$lessonSlug"
      params={{ courseSlug, lessonSlug: target }}
      replace
    />
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