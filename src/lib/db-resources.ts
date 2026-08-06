import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LessonResource = {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  resource_type: string;
  resource_order: number;
  created_at: string;
};

export function useLessonResources(lessonId: string | null) {
  const [items, setItems] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!lessonId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("lesson_resources")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("resource_order", { ascending: true });
    setItems((data ?? []) as LessonResource[]);
    setLoading(false);
  }, [lessonId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

/** All resources for a set of lessons (course-level file list). */
export function useCourseResources(lessonIds: string[]) {
  const [items, setItems] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const key = lessonIds.join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = key ? key.split(",") : [];
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("lesson_resources")
        .select("*")
        .in("lesson_id", ids)
        .order("resource_order", { ascending: true });
      if (cancelled) return;
      setItems((data ?? []) as LessonResource[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { items, loading };
}

export const RESOURCE_BUCKET = "lesson-resources";
/** Uploaded files are stored as `storage:<path>` in lesson_resources.url */
export const STORAGE_PREFIX = "storage:";

export function isStoredFile(url: string): boolean {
  return url.startsWith(STORAGE_PREFIX);
}

export function storagePath(url: string): string {
  return url.slice(STORAGE_PREFIX.length);
}

/** Resolve a resource url to an openable href (signed URL for uploaded files). */
export async function resolveResourceUrl(url: string): Promise<string | null> {
  if (!isStoredFile(url)) return url;
  const { data, error } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .createSignedUrl(storagePath(url), 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}