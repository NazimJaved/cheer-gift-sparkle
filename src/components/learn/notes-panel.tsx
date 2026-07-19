import { useEffect, useState } from "react";
import { Loader2, Save, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { useLessonNote } from "@/lib/db-notes";

export function NotesPanel({ lessonId, courseId }: { lessonId: string; courseId: string }) {
  const { note, loading, saving, save } = useLessonNote(lessonId, courseId);
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(note?.content ?? "");
  }, [note?.id, note?.content]);

  async function onSave() {
    await save(value);
    toast.success("নোট সংরক্ষিত হয়েছে");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> নোট লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <StickyNote className="h-4 w-4 text-teal" /> আমার নোট
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        placeholder="এই লেসনের জন্য নোট লিখুন..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{note?.updated_at ? `শেষ আপডেট: ${new Date(note.updated_at).toLocaleString("bn-BD")}` : "নতুন নোট"}</span>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} সংরক্ষণ
        </button>
      </div>
    </div>
  );
}