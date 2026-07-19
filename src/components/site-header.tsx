import { useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Menu, X, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/lib/use-admin";
import { useSiteContent, useSignedImage } from "@/lib/site-content";

const nav = [
  { to: "/", label: "হোম" },
  { to: "/courses", label: "কোর্সসমূহ" },
  { to: "/about", label: "আমাদের সম্পর্কে" },
  { to: "/contact", label: "যোগাযোগ" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const branding = useSiteContent("branding");
  const logoUrl = useSignedImage(branding.logo_image || null);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bengali">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal text-teal-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
          )}
          <span className="text-lg font-semibold tracking-tight">
            {branding.brand_name || "JB iT Academy"}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-teal bg-secondary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="rounded-md px-3 py-2 text-sm font-medium text-teal hover:text-teal/80"
                >
                  অ্যাডমিন
                </Link>
              ) : null}
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ড্যাশবোর্ড
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                লগআউট
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                লগইন
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground shadow-sm transition hover:bg-teal/90"
              >
                শুরু করুন
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-teal bg-secondary" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            {loading ? null : user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  ড্যাশবোর্ড
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium"
                >
                  লগআউট
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground"
              >
                লগইন / রেজিস্ট্রেশন
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}