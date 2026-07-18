import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, RotateCcw, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  SITE_CONTENT_DEFAULTS,
  getPageSchema,
  saveSiteContent,
  useSignedImage,
} from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/admin/content/$page")({
  component: AdminContentEditor,
});

function AdminContentEditor() {
  const { page } = useParams({ from: "/_authenticated/admin/content/$page" });
  const navigate = useNavigate();
  const schema = getPageSchema(page);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schema) return;
    setLoading(true);
    const defaults = SITE_CONTENT_DEFAULTS[page] ?? {};
    supabase
      .from("site_content")
      .select("data")
      .eq("key", page)
      .maybeSingle()
      .then(({ data }) => {
        const remote = (data?.data as Record<string, string> | null) ?? {};
        setValues({ ...defaults, ...remote });
        setLoading(false);
      });
  }, [page, schema]);

  if (!schema) {
    return (
      <div className="text-sm text-muted-foreground">
        এই পেজটি পাওয়া যায়নি।{" "}
        <Link to="/admin/content" className="text-teal underline">
          ফিরে যান
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(page, values);
      toast.success("কনটেন্ট সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValues(SITE_CONTENT_DEFAULTS[page] ?? {});
    toast.info("ডিফল্টে রিসেট হয়েছে (সংরক্ষণ করতে ভুলবেন না)");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/content"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> সব পেজ
          </Link>
          <h2 className="mt-2 text-xl font-semibold">{schema.label} — এডিট</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            পরিবর্তন সংরক্ষণ করলে পাবলিক পেজে সাথে সাথে দেখাবে।
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" /> ডিফল্ট
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            সংরক্ষণ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          {schema.fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                />
              ) : f.type === "image" ? (
                <ImageUpload
                  value={values[f.key] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                />
              ) : (
                <input
                  type="text"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                />
              )}
            </div>
          ))}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate({ to: "/admin/content" })}
        className="mt-4 text-xs text-muted-foreground hover:text-foreground"
      >
        বাতিল
      </button>
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const preview = useSignedImage(value || null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `site/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("course-thumbnails")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      onChange(path);
      toast.success("ইমেজ আপলোড হয়েছে");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {preview ? (
        <img src={preview} alt="preview" className="h-24 w-40 rounded-md border border-border object-cover" />
      ) : (
        <div className="grid h-24 w-40 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
          কোনো ইমেজ নেই
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          PC থেকে আপলোড
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary"
          >
            <X className="h-4 w-4" /> সরান
          </button>
        ) : null}
      </div>
    </div>
  );
}