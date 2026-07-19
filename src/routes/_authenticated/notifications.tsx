import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useNotifications } from "@/lib/db-notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function timeAgoBn(iso: string): string {
  const secs = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs} সেকেন্ড আগে`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${days} দিন আগে`;
}

function NotificationsPage() {
  const { items, loading, unread, markRead, markAllRead } = useNotifications();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6 text-teal" /> নোটিফিকেশন
          </h1>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              <CheckCheck className="h-3.5 w-3.5" /> সব পড়া হয়েছে
            </button>
          )}
        </div>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <Bell className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3">এখনো কোনো নোটিফিকেশন নেই</p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {items.map((n) => {
              const unreadRow = !n.read_at;
              const body = (
                <div className={`flex items-start gap-3 p-4 ${unreadRow ? "bg-teal/5" : ""}`}>
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      unreadRow ? "bg-teal" : "bg-transparent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgoBn(n.created_at)}
                      </span>
                    </div>
                    {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  </div>
                </div>
              );
              return (
                <li key={n.id} onClick={() => unreadRow && markRead(n.id)}>
                  {n.link ? (
                    <Link to={n.link} className="block hover:bg-secondary/40">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}