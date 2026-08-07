import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { isStoredFile, resolveResourceUrl, useLessonResources } from "@/lib/db-resources";

/** Shows PDF/link resources for one lesson. Renders nothing when the lesson has none. */
export function LessonFiles({ lessonId }: { lessonId: string }) {
  const { items, loading } = useLessonResources(lessonId);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function openStored(id: string, url: string) {
    setOpeningId(id);
    const href = await resolveResourceUrl(url);
    setOpeningId(null);
    if (!href) return toast.error("ফাইল খোলা যায়নি");
    window.open(href, "_blank", "noopener,noreferrer");
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="border-t border-dashed border-border bg-secondary/30 px-4 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        এই লেসনের ফাইল ও রিসোর্স
      </p>
      <ul className="space-y-1.5">
        {items.map((r) => {
          const icon =
            r.resource_type === "pdf" ? (
              <FileText className="h-4 w-4" />
            ) : r.resource_type === "file" ? (
              <Download className="h-4 w-4" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            );
          const inner = (
            <>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-teal/10 text-teal">{icon}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
            </>
          );
          if (isStoredFile(r.url)) {
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => openStored(r.id, r.url)}
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-card p-2 text-left hover:bg-secondary"
                >
                  {inner}
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
                className="flex items-center gap-3 rounded-md border border-border bg-card p-2 hover:bg-secondary"
              >
                {inner}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
