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
  const trimmed = url.trim();
  // Bare 11-char id
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    const v = parsed.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (host === "youtu.be" && parts[0] && /^[A-Za-z0-9_-]{11}$/.test(parts[0])) return parts[0];
    const knownPathIndex = parts.findIndex((part) => ["embed", "shorts", "live", "v"].includes(part));
    const candidate = knownPathIndex >= 0 ? parts[knownPathIndex + 1] : null;
    if ((host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) && candidate) {
      const cleanCandidate = candidate.split(/[?&#]/)[0];
      if (/^[A-Za-z0-9_-]{11}$/.test(cleanCandidate)) return cleanCandidate;
    }
  } catch {
    // Fall back to regex parsing below for pasted text/snippets.
  }

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id
    ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    : null;
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