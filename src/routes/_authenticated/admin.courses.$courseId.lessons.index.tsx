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
import type { Chapter, Lesson } from "@/lib/lessons";
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [savingChapter, setSavingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState("");
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadCourse() {
    const { data } = await supabase.from("courses").select("title").eq("id", courseId).maybeSingle();
    setCourseTitle(data?.title ?? "");
  }

  async function load() {
    setLoading(true);
    const [{ data: lessonData, error }, { data: chapterData }] = await Promise.all([
      supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("lesson_order", { ascending: true }),
      supabase
        .from("course_chapters")
        .select("id,course_id,title,chapter_order")
        .eq("course_id", courseId)
        .order("chapter_order", { ascending: true }),
    ]);
    if (error) toast.error(error.message);
    else setRows((lessonData ?? []) as Lesson[]);
    setChapters((chapterData ?? []) as Chapter[]);
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
  const deletingChapter = chapters.find((c) => c.id === deleteChapterId);

  async function addChapter() {
    const title = newChapterTitle.trim();
    if (!title) return;
    setSavingChapter(true);
    const nextOrder = (chapters[chapters.length - 1]?.chapter_order ?? 0) + 1;
    const { error } = await supabase
      .from("course_chapters")
      .insert({ course_id: courseId, title, chapter_order: nextOrder });
    setSavingChapter(false);
    if (error) return toast.error(error.message);
    setNewChapterTitle("");
    toast.success("চ্যাপ্টার যোগ হয়েছে");
    load();
  }

  async function saveChapterEdit() {
    if (!editingChapterId) return;
    const title = editingChapterTitle.trim();
    if (!title) return;
    const { error } = await supabase
      .from("course_chapters")
      .update({ title })
      .eq("id", editingChapterId);
    if (error) return toast.error(error.message);
    setEditingChapterId(null);
    toast.success("চ্যাপ্টার আপডেট হয়েছে");
    load();
  }

  async function moveChapter(id: string, dir: -1 | 1) {
    const idx = chapters.findIndex((c) => c.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= chapters.length) return;
    const a = chapters[idx];
    const b = chapters[swapIdx];
    const next = chapters.slice();
    next[idx] = { ...b, chapter_order: a.chapter_order };
    next[swapIdx] = { ...a, chapter_order: b.chapter_order };
    setChapters(next);
    await Promise.all([
      supabase.from("course_chapters").update({ chapter_order: b.chapter_order }).eq("id", a.id),
      supabase.from("course_chapters").update({ chapter_order: a.chapter_order }).eq("id", b.id),
    ]);
    load();
  }

  async function confirmDeleteChapter() {
    if (!deleteChapterId) return;
    const { error } = await supabase.from("course_chapters").delete().eq("id", deleteChapterId);
    setDeleteChapterId(null);
    if (error) return toast.error(error.message);
    toast.success("চ্যাপ্টার মুছে ফেলা হয়েছে");
    load();
  }

  const groups: { chapter: Chapter | null; lessons: Lesson[] }[] = [
    ...chapters.map((c) => ({
      chapter: c,
      lessons: filtered.filter((l) => l.chapter_id === c.id),
    })),
    { chapter: null, lessons: filtered.filter((l) => !l.chapter_id) },
  ];

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

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">চ্যাপ্টার / সেকশন</h3>
          <span className="text-xs text-muted-foreground">মোট {chapters.length}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChapter())}
            placeholder="নতুন চ্যাপ্টারের নাম"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <button
            onClick={addChapter}
            disabled={savingChapter || !newChapterTitle.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-teal px-3 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> যোগ
          </button>
        </div>
        {chapters.length > 0 && (
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {chapters.map((c, i) => {
              const count = rows.filter((r) => r.chapter_id === c.id).length;
              const isEditing = editingChapterId === c.id;
              return (
                <li key={c.id} className="flex items-center gap-2 p-2">
                  <span className="grid h-7 w-7 place-items-center rounded bg-teal/10 text-xs font-semibold text-teal">
                    {i + 1}
                  </span>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingChapterTitle}
                      onChange={(e) => setEditingChapterTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveChapterEdit();
                        if (e.key === "Escape") setEditingChapterId(null);
                      }}
                      className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground">{count} লেসন</div>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveChapter(c.id, -1)}
                      disabled={i === 0}
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      title="উপরে"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveChapter(c.id, 1)}
                      disabled={i === chapters.length - 1}
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      title="নিচে"
                    >
                      ↓
                    </button>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={saveChapterEdit}
                          className="rounded p-1.5 text-teal hover:bg-secondary"
                          title="সংরক্ষণ"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChapterId(null)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChapterId(c.id);
                          setEditingChapterTitle(c.title);
                        }}
                        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title="সম্পাদনা"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteChapterId(c.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="মুছুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
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
              <div className="divide-y divide-border">
                {groups.map((g) =>
                  g.lessons.length === 0 ? null : (
                    <div key={g.chapter?.id ?? "__none"}>
                      <div className="bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {g.chapter ? g.chapter.title : "চ্যাপ্টার ছাড়া"}
                        <span className="ml-2 font-normal normal-case">· {g.lessons.length} লেসন</span>
                      </div>
                      <ul className="divide-y divide-border">
                        {g.lessons.map((r) => (
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
                    </div>
                  ),
                )}
              </div>
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

      <AlertDialog open={!!deleteChapterId} onOpenChange={(o) => !o && setDeleteChapterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>চ্যাপ্টার মুছবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingChapter?.title}" মুছে ফেলা হবে। এই চ্যাপ্টারের লেসনগুলো "চ্যাপ্টার ছাড়া"-তে চলে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChapter}
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