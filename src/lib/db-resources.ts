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