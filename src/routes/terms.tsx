import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "শর্তাবলী — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির ব্যবহারের শর্তাবলী।" },
      { property: "og:title", content: "শর্তাবলী" },
      { property: "og:description", content: "প্ল্যাটফর্ম ব্যবহারের নিয়মাবলী।" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const c = useSiteContent("terms");
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.updated}</p>
        <p className="mt-6 text-sm text-muted-foreground">{c.intro}</p>
        <Section title={c.s1_title}>{c.s1_body}</Section>
        <Section title={c.s2_title}>{c.s2_body}</Section>
        <Section title={c.s3_title}>{c.s3_body}</Section>
        <Section title={c.s4_title}>{c.s4_body}</Section>
        <Section title={c.s5_title}>{c.s5_body}</Section>
      </article>
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}