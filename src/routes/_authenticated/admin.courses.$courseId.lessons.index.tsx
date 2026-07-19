import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Lesson } from "@/lib/lessons";
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

export const Route = createFileRoute("/_authenticated/admin/courses/$courseId/lessons/")({
  component: AdminLessonsPage,
});

function AdminLessonsPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [rows, setRows] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadCourse() {
    const { data } = await supabase.from("courses").select("title").eq("id", courseId).maybeSingle();
    setCourseTitle(data?.title ?? "");
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Lesson[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCourse();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.slug.toLowerCase().includes(term) ||
        (r.short_description ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function onDragEnd(e: DragEndEvent) {
    if (q.trim()) return; // reorder disabled while filtering
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({ ...r, lesson_order: i + 1 }));
    setRows(next);
    const updates = next.map((r) =>
      supabase.from("lessons").update({ lesson_order: r.lesson_order }).eq("id", r.id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error("ক্রম আপডেট ব্যর্থ: " + failed.error.message);
      load();
    } else {
      toast.success("ক্রম আপডেট হয়েছে");
    }
  }

  async function togglePublish(row: Lesson) {
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: !row.is_published })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(row.is_published ? "খসড়ায় নেওয়া হয়েছে" : "প্রকাশিত হয়েছে");
    load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("lessons").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("লেসন মুছে ফেলা হয়েছে");
    load();
  }

  const deletingTitle = rows.find((r) => r.id === deleteId)?.title;
  const publishedCount = rows.filter((r) => r.is_published).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> কোর্স তালিকা
          </Link>
          <h2 className="mt-1 text-xl font-semibold">লেসন ব্যবস্থাপনা</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {courseTitle && <>কোর্স: <span className="font-medium text-foreground">{courseTitle}</span> · </>}
            মোট {rows.length} · প্রকাশিত {publishedCount}
          </p>
        </div>
        <Link
          to="/admin/courses/$courseId/lessons/new"
          params={{ courseId }}
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90"
        >
          <Plus className="h-4 w-4" /> নতুন লেসন
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="লেসন খুঁজুন..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
        {q.trim() && (
          <p className="mt-2 text-xs text-muted-foreground">
            সার্চ চলাকালীন ড্র্যাগ-ড্রপ রিঅর্ডার বন্ধ থাকবে।
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            {rows.length === 0 ? "এখনও কোনো লেসন যোগ করা হয়নি" : "কোনো লেসন মেলে না"}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-border">
                {filtered.map((r) => (
                  <SortableRow
                    key={r.id}
                    lesson={r}
                    disabled={!!q.trim()}
                    onEdit={() =>
                      navigate({
                        to: "/admin/courses/$courseId/lessons/$lessonId/edit",
                        params: { courseId, lessonId: r.id },
                      })
                    }
                    onDelete={() => setDeleteId(r.id)}
                    onTogglePublish={() => togglePublish(r)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>লেসন মুছবেন?</AlertDialogTitle>
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

function SortableRow({
  lesson,
  disabled,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  lesson: Lesson;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 p-3">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`grid h-8 w-8 place-items-center rounded text-muted-foreground ${
          disabled ? "cursor-not-allowed opacity-40" : "cursor-grab hover:bg-secondary active:cursor-grabbing"
        }`}
        aria-label="ড্র্যাগ করে সরান"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="grid h-9 w-9 place-items-center rounded-md bg-teal/10 text-sm font-semibold text-teal">
        {lesson.lesson_order}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{lesson.title}</span>
          {lesson.is_free_preview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-medium text-green">
              <Sparkles className="h-3 w-3" /> ফ্রি প্রিভিউ
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              lesson.is_published ? "bg-teal/15 text-teal" : "bg-secondary text-muted-foreground"
            }`}
          >
            {lesson.is_published ? "প্রকাশিত" : "খসড়া"}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          /{lesson.slug}
          {lesson.duration ? ` · ${lesson.duration}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePublish}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title={lesson.is_published ? "খসড়ায় নিন" : "প্রকাশ করুন"}
        >
          {lesson.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button
          onClick={onEdit}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="সম্পাদনা"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="মুছুন"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}