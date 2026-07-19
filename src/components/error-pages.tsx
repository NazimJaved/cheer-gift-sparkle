import { Link } from "@tanstack/react-router";
import { ShieldAlert, Compass, ServerCrash } from "lucide-react";
import type { ReactNode } from "react";

function Shell({ icon, code, title, message, children }: { icon: ReactNode; code: string; title: string; message: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-teal/5 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 text-teal">
          {icon}
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">{code}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal/90"
          >
            হোমে ফিরে যান
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <Shell
      icon={<Compass className="h-10 w-10" />}
      code="404"
      title="পেজ খুঁজে পাওয়া যায়নি"
      message="আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে বা কখনো ছিল না। লিঙ্কটি পুনরায় যাচাই করুন।"
    />
  );
}

export function ForbiddenPage() {
  return (
    <Shell
      icon={<ShieldAlert className="h-10 w-10" />}
      code="403"
      title="প্রবেশাধিকার নেই"
      message="এই পেজটি দেখার অনুমতি আপনার নেই। যদি মনে করেন এটি একটি ভুল, তাহলে অ্যাডমিনের সাথে যোগাযোগ করুন।"
    />
  );
}

export function ServerErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <Shell
      icon={<ServerCrash className="h-10 w-10" />}
      code="500"
      title="কিছু একটা ভুল হয়েছে"
      message="সার্ভারে একটি সমস্যা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
    >
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          আবার চেষ্টা করুন
        </button>
      )}
    </Shell>
  );
}