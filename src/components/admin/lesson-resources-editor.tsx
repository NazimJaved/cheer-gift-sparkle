import { useState, type ChangeEvent } from "react";
import { FileText, Link as LinkIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  RESOURCE_BUCKET,
  STORAGE_PREFIX,
  isStoredFile,
  storagePath,
  useLessonResources,
} from "@/lib/db-resources";

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal";

export function LessonResourcesEditor({ lessonId }: { lessonId: string }) {
  const { items, loading, refresh } = useLessonResources(lessonId);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function addLink() {
    const t = title.trim();
    const u = url.trim();
    if (!t) return toast.error("রিসোর্সের নাম দিন");
    if (!/^https?:\/\//i.test(u)) return toast.error("সঠিক লিঙ্ক দিন (https://...)");
    setBusy(true);
    const isPdfLink = /\.pdf($|\?)/i.test(u);
    const { error } = await supabase.from("lesson_resources").insert({
      lesson_id: lessonId,
      title: t,
      url: u,
      resource_type: isPdfLink ? "pdf" : "link",
      resource_order: items.length,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setUrl("");
    toast.success("রিসোর্স যোগ হয়েছে");
    refresh();
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("ফাইল ২০MB এর কম হতে হবে");
    setBusy(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "-");
    const path = `${lessonId}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from(RESOURCE_BUCKET)
      .upload(path, file, { contentType: file.type || "application/pdf", upsert: false });
    if (upErr) {
      setBusy(false);
      return toast.error(upErr.message);
    }
    const { error } = await supabase.from("lesson_resources").insert({
      lesson_id: lessonId,
      title: title.trim() || file.name,
      url: `${STORAGE_PREFIX}${path}`,
      resource_type: file.type === "application/pdf" || safe.toLowerCase().endsWith(".pdf") ? "pdf" : "file",
      resource_order: items.length,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setTitle("");
    toast.success("ফাইল আপলোড হয়েছে");
    refresh();
  }

  async function remove(id: string, u: string) {
    setBusy(true);
    if (isStoredFile(u)) {
      await supabase.storage.from(RESOURCE_BUCKET).remove([storagePath(u)]);
    }
    const { error } = await supabase.from("lesson_resources").delete().eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("মুছে ফেলা হয়েছে");
    refresh();
  }

  return (
    <div className="rounded-lg border border-input p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">রিসোর্স (PDF / লিঙ্ক)</h3>
        <p className="text-xs text-muted-foreground">
          Google Drive-এর পাবলিক লিঙ্ক দিন, অথবা সরাসরি PDF আপলোড করুন।
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">এখনো কোনো রিসোর্স নেই।</p>
      ) : (
        <ul className="mb-4 divide-y divide-border rounded-md border border-border">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-teal/10 text-teal">
                {isStoredFile(r.url) ? <FileText className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {isStoredFile(r.url) ? "আপলোডকৃত ফাইল" : r.url}
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(r.id, r.url)}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                aria-label="মুছুন"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="রিসোর্সের নাম (যেমন: ক্লাস নোট PDF)"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/.../view"
          />
          <button
            type="button"
            disabled={busy}
            onClick={addLink}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> লিঙ্ক যোগ
          </button>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          PDF/ফাইল আপলোড
          <input
            type="file"
            accept=".pdf,application/pdf,.doc,.docx,.zip,image/*"
            className="hidden"
            disabled={busy}
            onChange={onFile}
          />
        </label>
      </div>
    </div>
  );
}