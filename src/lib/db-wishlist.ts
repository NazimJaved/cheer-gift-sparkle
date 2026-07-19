import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useWishlistIds() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("wishlist").select("course_id").eq("user_id", user.id);
    setIds(new Set((data ?? []).map((r) => r.course_id as string)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggle(courseId: string) {
    if (!user) return;
    if (ids.has(courseId)) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("course_id", courseId);
      setIds((prev) => {
        const n = new Set(prev);
        n.delete(courseId);
        return n;
      });
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, course_id: courseId });
      setIds((prev) => new Set(prev).add(courseId));
    }
  }

  return { ids, loading, toggle, refresh };
}