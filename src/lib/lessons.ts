import { supabase } from "@/integrations/supabase/client";

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  youtube_url: string | null;
  lesson_order: number;
  duration: string | null;
  is_free_preview: boolean;
  is_published: boolean;
  created_at: string;
};

export function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `lesson-${Date.now().toString(36)}`;
}

/**
 * Extract a YouTube video id from a variety of URL formats.
 * Returns null if the URL doesn't look like YouTube.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
}

export async function isEnrolled(courseId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}