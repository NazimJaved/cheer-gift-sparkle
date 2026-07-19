import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type EnrolledCourseInfo = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  thumbnail: string | null;
  level: string | null;
  duration: string | null;
  total_lessons: number | null;
};

export type CourseProgress = {
  course: EnrolledCourseInfo;
  completedCount: number;
  totalLessons: number;
  percent: number;
  lastLessonSlug: string | null;
  lastLessonTitle: string | null;
  lastWatchedAt: string | null;
  remainingMinutes: number | null;
};

function parseDurationMinutes(d: string | null): number {
  if (!d) return 0;
  const m = d.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export function useEnrolledCoursesProgress() {
  const { user } = useAuth();
  const [items, setItems] = useState<CourseProgress[] | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    (async () => {
      const { data: en } = await supabase
        .from("enrollments")
        .select("course:courses(id, slug, title, short_description, thumbnail, level, duration, total_lessons)")
        .eq("user_id", user.id);
      const courses = ((en ?? []) as Array<{ course: EnrolledCourseInfo | null }>)
        .map((r) => r.course)
        .filter((c): c is EnrolledCourseInfo => !!c);
      if (courses.length === 0) {
        setItems([]);
        return;
      }
      const courseIds = courses.map((c) => c.id);
      const [{ data: lessons }, { data: progress }] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, slug, title, duration, course_id, lesson_order")
          .in("course_id", courseIds)
          .eq("is_published", true)
          .order("lesson_order", { ascending: true }),
        supabase
          .from("lesson_progress")
          .select("lesson_id, course_id, completed, last_watched_at")
          .eq("user_id", user.id)
          .in("course_id", courseIds),
      ]);
      const result: CourseProgress[] = courses.map((c) => {
        const clessons = (lessons ?? []).filter((l) => l.course_id === c.id);
        const cprog = (progress ?? []).filter((p) => p.course_id === c.id);
        const completedIds = new Set(cprog.filter((p) => p.completed).map((p) => p.lesson_id));
        const total = clessons.length;
        const done = clessons.filter((l) => completedIds.has(l.id)).length;
        const sorted = [...cprog].sort((a, b) =>
          (b.last_watched_at ?? "").localeCompare(a.last_watched_at ?? ""),
        );
        const lastProg = sorted[0];
        const lastLesson = lastProg ? clessons.find((l) => l.id === lastProg.lesson_id) : null;
        const remainingMinutes = clessons
          .filter((l) => !completedIds.has(l.id))
          .reduce((sum, l) => sum + parseDurationMinutes(l.duration), 0);
        return {
          course: c,
          completedCount: done,
          totalLessons: total,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
          lastLessonSlug: lastLesson?.slug ?? null,
          lastLessonTitle: lastLesson?.title ?? null,
          lastWatchedAt: lastProg?.last_watched_at ?? null,
          remainingMinutes: remainingMinutes || null,
        };
      });
      setItems(result);
    })();
  }, [user]);

  return items;
}

export type RecentLesson = {
  lesson_id: string;
  course_id: string;
  lesson_slug: string;
  lesson_title: string;
  course_slug: string;
  course_title: string;
  last_watched_at: string;
  completed: boolean;
};

export function useRecentLessons(limit = 5) {
  const { user } = useAuth();
  const [items, setItems] = useState<RecentLesson[] | null>(null);
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, course_id, completed, last_watched_at, lesson:lessons(slug,title), course:courses(slug,title)")
        .eq("user_id", user.id)
        .order("last_watched_at", { ascending: false })
        .limit(limit);
      const rows = ((data ?? []) as Array<{
        lesson_id: string;
        course_id: string;
        completed: boolean;
        last_watched_at: string;
        lesson: { slug: string; title: string } | null;
        course: { slug: string; title: string } | null;
      }>)
        .filter((r) => r.lesson && r.course)
        .map((r) => ({
          lesson_id: r.lesson_id,
          course_id: r.course_id,
          lesson_slug: r.lesson!.slug,
          lesson_title: r.lesson!.title,
          course_slug: r.course!.slug,
          course_title: r.course!.title,
          last_watched_at: r.last_watched_at,
          completed: r.completed,
        }));
      setItems(rows);
    })();
  }, [user, limit]);
  return items;
}