import { Download, ExternalLink, FileText, Loader2, Link as LinkIcon } from "lucide-react";
import { useLessonResources } from "@/lib/db-resources";

export function ResourcesPanel({ lessonId }: { lessonId: string }) {
  const { items, loading } = useLessonResources(lessonId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> রিসোর্স লোড হচ্ছে...
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">এই লেসনে কোনো রিসোর্স নেই।</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((r) => {
        const isDl = r.resource_type === "pdf" || r.resource_type === "file";
        return (
          <li key={r.id}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              download={isDl}
              className="flex items-center gap-3 p-3 hover:bg-secondary"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal/10 text-teal">
                {r.resource_type === "pdf" ? (
                  <FileText className="h-4 w-4" />
                ) : r.resource_type === "file" ? (
                  <Download className="h-4 w-4" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}