import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent } from "@/lib/site-content";
import { usePageBlocks } from "@/lib/page-blocks";
import { BlockRenderer } from "@/components/editor/block-renderer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "গোপনীয়তা নীতি — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির গোপনীয়তা নীতি।" },
      { property: "og:title", content: "গোপনীয়তা নীতি" },
      { property: "og:description", content: "আপনার তথ্য কীভাবে সংগৃহীত ও ব্যবহৃত হয়।" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const c = useSiteContent("privacy");
  const blocks = usePageBlocks("privacy");
  if (blocks && blocks.length > 0) {
    return (
      <SiteLayout>
        <BlockRenderer blocks={blocks} />
      </SiteLayout>
    );
  }
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
        <Section title={c.s6_title}>{c.s6_body}</Section>
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