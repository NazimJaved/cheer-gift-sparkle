import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type LessonNote = {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export function useLessonNote(lessonId: string | null, courseId: string | null) {
  const { user } = useAuth();
  const [note, setNote] = useState<LessonNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !lessonId) {
      setNote(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("lesson_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();
    setNote((data as LessonNote) ?? null);
    setLoading(false);
  }, [user, lessonId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  async function save(content: string) {
    if (!user || !lessonId || !courseId) return;
    setSaving(true);
    const { data } = await supabase
      .from("lesson_notes")
      .upsert(
        {
          id: note?.id,
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          content,
        },
        { onConflict: "id" },
      )
      .select()
      .maybeSingle();
    if (data) setNote(data as LessonNote);
    setSaving(false);
  }

  return { note, loading, saving, save };
}