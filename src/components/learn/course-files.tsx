import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { isStoredFile, resolveResourceUrl, useCourseResources } from "@/lib/db-resources";

export function CourseFiles({ lessons }: { lessons: { id: string; title: string }[] }) {
  const { items, loading } = useCourseResources(lessons.map((l) => l.id));
  const [openingId, setOpeningId] = useState<string | null>(null);
  const titleOf = (id: string) => lessons.find((l) => l.id === id)?.title ?? "";

  async function openStored(id: string, url: string) {
    setOpeningId(id);
    const href = await resolveResourceUrl(url);
    setOpeningId(null);
    if (!href) return toast.error("ফাইল খোলা যায়নি");
    window.open(href, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> ফাইল লোড হচ্ছে...
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">কোর্স ফাইল ও রিসোর্স</h2>
        <p className="text-xs text-muted-foreground">PDF ও লিঙ্ক ফাইল এখান থেকে ডাউনলোড করুন।</p>
      </div>
      <ul className="divide-y divide-border">
        {items.map((r) => {
          const icon =
            r.resource_type === "pdf" ? (
              <FileText className="h-4 w-4" />
            ) : r.resource_type === "file" ? (
              <Download className="h-4 w-4" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            );
          const label = (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{r.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{titleOf(r.lesson_id)}</span>
            </span>
          );
          if (isStoredFile(r.url)) {
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => openStored(r.id, r.url)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal/10 text-teal">
                    {icon}
                  </span>
                  {label}
                  {openingId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </li>
            );
          }
          return (
            <li key={r.id}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 hover:bg-secondary"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal/10 text-teal">
                  {icon}
                </span>
                {label}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
