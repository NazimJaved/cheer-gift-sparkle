import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSignedThumbnailUrl } from "@/lib/use-admin";

export type CourseFormValues = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  instructor_name: string;
  duration: string;
  total_lessons: number;
  price: number;
  discount_price: number | null;
  thumbnail: string | null;
  preview_video_url: string;
  published: boolean;
};

export const emptyCourse: CourseFormValues = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  category: "",
  level: "beginner",
  language: "Bengali",
  instructor_name: "",
  duration: "",
  total_lessons: 0,
  price: 0,
  discount_price: null,
  thumbnail: null,
  preview_video_url: "",
  published: false,
};

export function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Props = {
  initial?: Partial<CourseFormValues>;
  submitLabel: string;
  onSubmit: (values: CourseFormValues) => Promise<void>;
};

export function CourseForm({ initial, submitLabel, onSubmit }: Props) {
  const [values, setValues] = useState<CourseFormValues>({ ...emptyCourse, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getSignedThumbnailUrl(values.thumbnail).then(setThumbUrl);
  }, [values.thumbnail]);

  function set<K extends keyof CourseFormValues>(k: K, v: CourseFormValues[K]) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("course-thumbnails")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      set("thumbnail", path);
      toast.success("থাম্বনেইল আপলোড হয়েছে");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "আপলোড ব্যর্থ";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!values.title || !values.slug) {
      const m = "শিরোনাম এবং স্লাগ আবশ্যক";
      setSubmitError(m);
      toast.error(m);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      const m = err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ হয়েছে";
      console.error("Course submit failed:", err);
      setSubmitError(m);
      toast.error(m);
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="শিরোনাম *">
          <input
            className={input}
            value={values.title}
            onChange={(e) => {
              const t = e.target.value;
              set("title", t);
              if (!initial?.slug) set("slug", slugify(t));
            }}
            required
          />
        </Field>
        <Field label="স্লাগ *">
          <input className={input} value={values.slug} onChange={(e) => set("slug", slugify(e.target.value))} required />
        </Field>
        <Field label="ক্যাটাগরি">
          <input className={input} value={values.category} onChange={(e) => set("category", e.target.value)} />
        </Field>
        <Field label="লেভেল">
          <select className={input} value={values.level} onChange={(e) => set("level", e.target.value as CourseFormValues["level"])}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Field>
        <Field label="ভাষা">
          <input className={input} value={values.language} onChange={(e) => set("language", e.target.value)} />
        </Field>
        <Field label="ইন্সট্রাক্টর">
          <input className={input} value={values.instructor_name} onChange={(e) => set("instructor_name", e.target.value)} />
        </Field>
        <Field label="সময়কাল (যেমন: 6 সপ্তাহ)">
          <input className={input} value={values.duration} onChange={(e) => set("duration", e.target.value)} />
        </Field>
        <Field label="মোট লেসন">
          <input type="number" min={0} className={input} value={values.total_lessons} onChange={(e) => set("total_lessons", Number(e.target.value))} />
        </Field>
        <Field label="দাম (৳)">
          <input type="number" min={0} step="0.01" className={input} value={values.price} onChange={(e) => set("price", Number(e.target.value))} />
        </Field>
        <Field label="ডিসকাউন্ট দাম (৳)">
          <input
            type="number"
            min={0}
            step="0.01"
            className={input}
            value={values.discount_price ?? ""}
            onChange={(e) => set("discount_price", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Field>
        <Field label="প্রিভিউ ভিডিও URL" className="md:col-span-2">
          <input className={input} value={values.preview_video_url} onChange={(e) => set("preview_video_url", e.target.value)} placeholder="https://youtube.com/..." />
        </Field>
      </div>

      <Field label="সংক্ষিপ্ত বিবরণ">
        <textarea className={input} rows={2} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} />
      </Field>

      <Field label="সম্পূর্ণ বিবরণ">
        <textarea className={input} rows={6} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <Field label="থাম্বনেইল ইমেজ">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {thumbUrl ? (
            <img src={thumbUrl} alt="thumbnail" className="h-24 w-40 rounded-md border border-border object-cover" />
          ) : (
            <div className="grid h-24 w-40 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              কোনো ইমেজ নেই
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            আপলোড করুন
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.published} onChange={(e) => set("published", e.target.checked)} />
        প্রকাশিত করুন
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-teal px-5 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
      {submitError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      ) : null}
    </form>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}