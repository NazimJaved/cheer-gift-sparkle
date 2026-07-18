import { createFileRoute, Link, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ListVideo,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSignedThumbnailUrl } from "@/lib/use-admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  price: number;
  discount_price: number | null;
  published: boolean;
  level: string | null;
  category: string | null;
  thumbnail: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: AdminCoursesPage,
});

const PAGE_SIZE = 10;

function AdminCoursesPage() {
  const matches = useMatches();
  const hasChildRoute = matches.some(
    (match) =>
      match.routeId === "/_authenticated/admin/courses/new" ||
      match.routeId === "/_authenticated/admin/courses/$id/edit" ||
      match.routeId === "/_authenticated/admin/courses/$courseId/lessons" ||
      match.routeId === "/_authenticated/admin/courses/$courseId/lessons/new" ||
      match.routeId === "/_authenticated/admin/courses/$courseId/lessons/$lessonId/edit",
  );

  if (hasChildRoute) return <Outlet />;

  return <AdminCoursesIndex />;
}

function AdminCoursesIndex() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string | null>>({});

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  async function load() {
    setLoading(true);
    let query = supabase
      .from("courses")
      .select("id,title,slug,price,discount_price,published,level,category,thumbnail,created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
    if (filter === "published") query = query.eq("published", true);
    if (filter === "draft") query = query.eq("published", false);

    const from = (page - 1) * PAGE_SIZE;
    const { data, error, count: c } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      toast.error(error.message);
    } else {
      setRows((data ?? []) as CourseRow[]);
      setCount(c ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        rows.map(async (r) => [r.id, await getSignedThumbnailUrl(r.thumbnail)] as const),
      );
      setThumbUrls(Object.fromEntries(entries));
    })();
  }, [rows]);

  async function togglePublish(row: CourseRow) {
    const { error } = await supabase
      .from("courses")
      .update({ published: !row.published })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(row.published ? "খসড়ায় নেওয়া হয়েছে" : "প্রকাশিত হয়েছে");
    load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("courses").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("কোর্স মুছে ফেলা হয়েছে");
    load();
  }

  const deletingTitle = useMemo(() => rows.find((r) => r.id === deleteId)?.title, [rows, deleteId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">কোর্স তালিকা</h2>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90"
        >
          <Plus className="h-4 w-4" /> নতুন কোর্স
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="কোর্স খুঁজুন..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-input p-1">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setPage(1);
                setFilter(f);
              }}
              className={`rounded px-3 py-1.5 text-xs font-medium ${filter === f ? "bg-teal text-teal-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {f === "all" ? "সব" : f === "published" ? "প্রকাশিত" : "খসড়া"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="p-3 font-medium">কোর্স</th>
                <th className="p-3 font-medium">লেভেল</th>
                <th className="p-3 font-medium">দাম</th>
                <th className="p-3 font-medium">স্ট্যাটাস</th>
                <th className="p-3 text-right font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    কোনো কোর্স পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {thumbUrls[r.id] ? (
                          <img
                            src={thumbUrls[r.id]!}
                            alt=""
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="grid h-10 w-16 place-items-center rounded bg-secondary text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{r.title}</div>
                          <div className="text-xs text-muted-foreground">/{r.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 capitalize">{r.level ?? "—"}</td>
                    <td className="p-3">
                      {r.discount_price != null ? (
                        <span>
                          <span className="font-medium text-green">৳{r.discount_price}</span>
                          <span className="ml-1 text-xs text-muted-foreground line-through">
                            ৳{r.price}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium">৳{r.price}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.published ? "bg-green/15 text-green" : "bg-secondary text-muted-foreground"}`}
                      >
                        {r.published ? "প্রকাশিত" : "খসড়া"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => togglePublish(r)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title={r.published ? "খসড়ায় নিন" : "প্রকাশ করুন"}
                        >
                          {r.published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            navigate({
                              to: "/admin/courses/$courseId/lessons",
                              params: { courseId: r.id },
                            })
                          }
                          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="লেসন ব্যবস্থাপনা"
                        >
                          <ListVideo className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate({ to: "/admin/courses/$id/edit", params: { id: r.id } })
                          }
                          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="সম্পাদনা"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="মুছুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-3 text-sm">
          <span className="text-muted-foreground">
            মোট {count} — পেজ {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              পূর্ববর্তী
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-40"
            >
              পরবর্তী
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কোর্স মুছবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingTitle}" স্থায়ীভাবে মুছে যাবে। এই কাজটি অপরিবর্তনীয়।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}