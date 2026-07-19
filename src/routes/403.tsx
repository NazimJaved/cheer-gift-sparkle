import { createFileRoute } from "@tanstack/react-router";
import { ForbiddenPage } from "@/components/error-pages";

export const Route = createFileRoute("/403")({
  head: () => ({ meta: [{ title: "প্রবেশাধিকার নেই" }, { name: "robots", content: "noindex" }] }),
  component: ForbiddenPage,
});