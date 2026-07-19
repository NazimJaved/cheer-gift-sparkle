import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedThumbnailUrl } from "@/lib/use-admin";

export type DbCourse = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  level: string | null;
  language: string | null;
  instructor_name: string | null;
  duration: string | null;
  total_lessons: number | null;
  price: number | null;
  discount_price: number | null;
  thumbnail: string | null;
  preview_video_url: string | null;
  published: boolean;
};

export type DbLesson = {
  id: string;
  title: string;
  slug: string;
  lesson_order: number;
  duration: string | null;
  is_free_preview: boolean;
};

export function usePublishedCourses() {
  const [courses, setCourses] = useState<DbCourse[] | null>(null);
  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCourses((data ?? []) as DbCourse[]));
  }, []);
  return courses;
}

export function useCourseBySlug(slug: string) {
  const [course, setCourse] = useState<DbCourse | null | undefined>(undefined);
  const [lessons, setLessons] = useState<DbLesson[]>([]);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(async ({ data }) => {
        if (cancelled) return;
        setCourse((data as DbCourse) ?? null);
        if (data) {
          const { data: ls } = await supabase
            .from("lessons")
            .select("id,title,slug,lesson_order,duration,is_free_preview")
            .eq("course_id", (data as DbCourse).id)
            .eq("is_published", true)
            .order("lesson_order", { ascending: true });
          if (!cancelled) setLessons((ls ?? []) as DbLesson[]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return { course, lessons };
}

export function useSignedCourseThumb(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(path).then(setUrl);
  }, [path]);
  return url;
}

export function formatPrice(price: number | null, discount: number | null) {
  if (price == null || price === 0) return "ফ্রি";
  if (discount != null && discount > 0 && discount < price) {
    return `৳${discount} (৳${price})`;
  }
  return `৳${price}`;
}