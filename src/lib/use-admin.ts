import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, loading]);

  return { isAdmin, loading: loading || isAdmin === null };
}

export async function getSignedThumbnailUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  // If already a full URL, return as-is
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage
    .from("course-thumbnails")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}