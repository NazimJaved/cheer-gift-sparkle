import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { SITE_CONTENT_SCHEMA } from "@/lib/site-content";
import { useAuth } from "@/lib/auth-context";
import { ForbiddenPage } from "@/components/error-pages";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContentLayout,
});

function AdminContentLayout() {
  const { isSuperAdmin, loading } = useAuth();
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/_authenticated/admin/content/$page");
  if (loading) return null;
  if (!isSuperAdmin) return <ForbiddenPage />;
  if (hasChild) return <Outlet />;
  return <AdminContentIndex />;
}

function AdminContentIndex() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">কনটেন্ট এডিট</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          পাবলিক পেজগুলোর টেক্সট এখান থেকে এডিট করুন।
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_CONTENT_SCHEMA.map((page) => (
          <Link
            key={page.key}
            to="/admin/content/$page"
            params={{ page: page.key }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-teal hover:shadow-md"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{page.label}</div>
              <div className="text-xs text-muted-foreground">
                {page.fields.length} টি ফিল্ড
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}