import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Achievement = {
  id: string;
  kind: string;
  course_id: string | null;
  metadata: Record<string, unknown>;
  earned_at: string;
};

export type LearningStreak = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

export function useAchievements() {
  const { user } = useAuth();
  const [items, setItems] = useState<Achievement[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("achievements")
      .select("id, kind, course_id, metadata, earned_at")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Achievement[]));
  }, [user]);
  return items;
}

export function useLearningStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<LearningStreak | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("learning_streaks")
      .select("current_streak, longest_streak, last_active_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setStreak((data as LearningStreak) ?? { current_streak: 0, longest_streak: 0, last_active_date: null }));
  }, [user]);
  return streak;
}