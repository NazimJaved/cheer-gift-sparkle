import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { DbCourse } from "@/lib/db-courses";
import { getSignedThumbnailUrl } from "@/lib/use-admin";

export const Route = createFileRoute("/_authenticated/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbCourse[] | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("wishlist")
      .select("course:courses(*)")
      .eq("user_id", user.id);
    const list = ((data ?? []) as Array<{ course: DbCourse | null }>)
      .map((r) => r.course)
      .filter((c): c is DbCourse => !!c && c.published);
    setItems(list);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function remove(id: string) {
    if (!user) return;
    await supabase.from("wishlist").delete().eq("user_id", user.id).eq("course_id", id);
    setItems((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Heart className="h-6 w-6 text-teal" /> উইশলিস্ট
        </h1>
        {items === null ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <Heart className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3">উইশলিস্টে কোনো কোর্স নেই</p>
            <Link
              to="/courses"
              className="mt-4 inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground"
            >
              কোর্স ব্রাউজ করুন
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <WishItem key={c.id} c={c} onRemove={() => remove(c.id)} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function WishItem({ c, onRemove }: { c: DbCourse; onRemove: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    getSignedThumbnailUrl(c.thumbnail).then(setThumb);
  }, [c.thumbnail]);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <Link to="/courses/$slug" params={{ slug: c.slug }}>
        <div className="aspect-video overflow-hidden bg-gradient-to-br from-teal/20 to-green/30">
          {thumb && <img src={thumb} alt={c.title} className="h-full w-full object-cover" />}
        </div>
      </Link>
      <div className="p-4">
        <h3 className="font-semibold">{c.title}</h3>
        {c.short_description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.short_description}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        aria-label="remove"
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}