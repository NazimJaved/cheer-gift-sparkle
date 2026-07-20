import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { supabase } from "../integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { NotFoundPage, ServerErrorPage } from "@/components/error-pages";

function NotFoundComponent() {
  return <NotFoundPage />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return <ServerErrorPage onRetry={() => { router.invalidate(); reset(); }} />;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JB iT একাডেমি — বাংলাদেশি শিক্ষার্থীদের জন্য অনলাইন কোর্স" },
      { name: "description", content: "বাংলা ভাষায় আধুনিক অনলাইন কোর্স। ডিজিটাল আমিনশিপ শিখুন হাতে-কলমে, নিজের গতিতে।" },
      { property: "og:title", content: "JB iT একাডেমি — বাংলাদেশি শিক্ষার্থীদের জন্য অনলাইন কোর্স" },
      { property: "og:description", content: "বাংলা ভাষায় আধুনিক অনলাইন কোর্স। ডিজিটাল আমিনশিপ শিখুন হাতে-কলমে, নিজের গতিতে।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JB iT একাডেমি — বাংলাদেশি শিক্ষার্থীদের জন্য অনলাইন কোর্স" },
      { name: "twitter:description", content: "বাংলা ভাষায় আধুনিক অনলাইন কোর্স। ডিজিটাল আমিনশিপ শিখুন হাতে-কলমে, নিজের গতিতে।" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a54b69b-7995-4290-b607-a4728312c506/id-preview-3df21336--04826026-f717-452b-a8cc-8565906bfe21.lovable.app-1784528234630.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a54b69b-7995-4290-b607-a4728312c506/id-preview-3df21336--04826026-f717-452b-a8cc-8565906bfe21.lovable.app-1784528234630.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
