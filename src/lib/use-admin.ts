import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useIsAdmin() {
  const { isAdmin, loading } = useAuth();
  return { isAdmin, loading };
}

export function useIsSuperAdmin() {
  const { isSuperAdmin, loading } = useAuth();
  return { isSuperAdmin, loading };
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