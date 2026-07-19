import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, LayoutDashboard, Bell, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/db-notifications";

type Item = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: Item[] = [
  { to: "/", label: "হোম", icon: Home, exact: true },
  { to: "/courses", label: "কোর্স", icon: BookOpen },
  { to: "/dashboard", label: "ড্যাশ", icon: LayoutDashboard },
  { to: "/notifications", label: "নোটিফ", icon: Bell },
  { to: "/profile", label: "প্রোফাইল", icon: User },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { unread } = useNotifications();
  if (!user) return null;
  // Hide inside admin
  if (path.startsWith("/admin")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? path === to : path === to || path.startsWith(to + "/");
          return (
            <li key={to}>
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] ${
                  active ? "text-teal" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {to === "/notifications" && unread > 0 && (
                  <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}