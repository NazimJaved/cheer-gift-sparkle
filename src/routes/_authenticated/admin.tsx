import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2, LayoutDashboard, BookOpen, FileText, Paintbrush } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useIsAdmin } from "@/lib/use-admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAdmin === false) {
      toast.error("অ্যাডমিন প্যানেলে প্রবেশাধিকার নেই।");
      navigate({ to: "/", replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> যাচাই করা হচ্ছে...
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">অ্যাডমিন প্যানেল</h1>
            <p className="mt-1 text-sm text-muted-foreground">কোর্স ও শিক্ষার্থী ব্যবস্থাপনা</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
              activeProps={{ className: "bg-teal text-teal-foreground border-teal" }}
              activeOptions={{ exact: true }}
            >
              <LayoutDashboard className="h-4 w-4" /> ওভারভিউ
            </Link>
            <Link
              to="/admin/courses"
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
              activeProps={{ className: "bg-teal text-teal-foreground border-teal" }}
            >
              <BookOpen className="h-4 w-4" /> কোর্স ব্যবস্থাপনা
            </Link>
            <Link
              to="/admin/content"
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
              activeProps={{ className: "bg-teal text-teal-foreground border-teal" }}
            >
              <FileText className="h-4 w-4" /> কনটেন্ট এডিট
            </Link>
            <Link
              to="/admin/edit/$page"
              params={{ page: "home" }}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
              activeProps={{ className: "bg-teal text-teal-foreground border-teal" }}
            >
              <Paintbrush className="h-4 w-4" /> ভিজ্যুয়াল এডিটর
            </Link>
          </nav>
        </div>
        <Outlet />
      </div>
    </SiteLayout>
  );
}