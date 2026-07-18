import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { slugify, type Lesson, extractYouTubeId } from "@/lib/lessons";

type FormState = {
  title: string;
  slug: string;
  short_description: string;
  youtube_url: string;
  duration: string;
  is_free_preview: boolean;
  is_published: boolean;
};

function toForm(l?: Lesson): FormState {
  return {
    title: l?.title ?? "",
    slug: l?.slug ?? "",
    short_description: l?.short_description ?? "",
    youtube_url: l?.youtube_url ?? "",
    duration: l?.duration ?? "",
    is_free_preview: l?.is_free_preview ?? false,
    is_published: l?.is_published ?? false,
  };
}

export function LessonForm({
  courseId,
  lesson,
}: {
  courseId: string;
  lesson?: Lesson;
}) {
  const navigate = useNavigate();
  const [f, setF] = useState<FormState>(toForm(lesson));
  const [slugTouched, setSlugTouched] = useState(!!lesson);
  const [saving, setSaving] = useState(false);

  useEffect(() => setF(toForm(lesson)), [lesson]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("লেসনের নাম দিন");
    if (f.youtube_url && !extractYouTubeId(f.youtube_url)) {
      return toast.error("সঠিক YouTube URL দিন");
    }

    setSaving(true);
    const finalSlug = (f.slug || slugify(f.title)).trim();
    const payload = {
      course_id: courseId,
      title: f.title.trim(),
      slug: finalSlug,
      short_description: f.short_description.trim() || null,
      youtube_url: f.youtube_url.trim() || null,
      duration: f.duration.trim() || null,
      is_free_preview: f.is_free_preview,
      is_published: f.is_published,
    };

    if (lesson) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", lesson.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("সংরক্ষিত হয়েছে");
      navigate({ to: "/admin/courses/$courseId/lessons", params: { courseId } });
      return;
    }

    // Compute next lesson_order
    const { data: maxRow } = await supabase
      .from("lessons")
      .select("lesson_order")
      .eq("course_id", courseId)
      .order("lesson_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxRow?.lesson_order ?? 0) + 1;

    const { error } = await supabase
      .from("lessons")
      .insert({ ...payload, lesson_order: nextOrder });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("লেসন যোগ হয়েছে");
    navigate({ to: "/admin/courses/$courseId/lessons", params: { courseId } });
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium">লেসনের নাম *</label>
        <input
          className={inputCls}
          value={f.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
          placeholder="যেমন: ডিজিটাল আমিনশিপ কী?"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">স্লাগ</label>
        <input
          className={inputCls}
          value={f.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          placeholder="lesson-1"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">সংক্ষিপ্ত বিবরণ</label>
        <textarea
          className={inputCls}
          rows={3}
          value={f.short_description}
          onChange={(e) => set("short_description", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          YouTube ভিডিও URL (আনলিস্টেড)
        </label>
        <input
          className={inputCls}
          value={f.youtube_url}
          onChange={(e) => set("youtube_url", e.target.value)}
          placeholder="https://youtu.be/xxxxxxxxxxx"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          YouTube-এ ভিডিও আপলোড করে <span className="font-medium">Unlisted</span> করে লিঙ্ক পেস্ট করুন।
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">সময়কাল</label>
        <input
          className={inputCls}
          value={f.duration}
          onChange={(e) => set("duration", e.target.value)}
          placeholder="১২ মিনিট"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-md border border-input p-3">
          <input
            type="checkbox"
            checked={f.is_free_preview}
            onChange={(e) => set("is_free_preview", e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          <div>
            <div className="text-sm font-medium">ফ্রি প্রিভিউ</div>
            <div className="text-xs text-muted-foreground">যেকেউ দেখতে পারবে</div>
          </div>
        </label>
        <label className="flex items-center gap-3 rounded-md border border-input p-3">
          <input
            type="checkbox"
            checked={f.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          <div>
            <div className="text-sm font-medium">প্রকাশিত</div>
            <div className="text-xs text-muted-foreground">শিক্ষার্থীদের কাছে দৃশ্যমান</div>
          </div>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          সংরক্ষণ করুন
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/courses/$courseId/lessons", params: { courseId } })}
          className="rounded-md border border-input px-4 py-2.5 text-sm hover:bg-secondary"
        >
          বাতিল
        </button>
      </div>
    </form>
  );
}