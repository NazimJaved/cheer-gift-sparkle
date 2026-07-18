import { createFileRoute } from "@tanstack/react-router";
import { Target, Heart, Users } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent, useSignedImage } from "@/lib/site-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির লক্ষ্য, দৃষ্টিভঙ্গি এবং গল্প।" },
      { property: "og:title", content: "আমাদের সম্পর্কে — আমিনশিপ একাডেমি" },
      { property: "og:description", content: "বাংলাদেশি শিক্ষার্থীদের জন্য বাংলা ভাষার অনলাইন লার্নিং প্ল্যাটফর্ম।" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const c = useSiteContent("about");
  const heroImg = useSignedImage(c.hero_image);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{c.title}</h1>
        {heroImg ? (
          <img
            src={heroImg}
            alt={c.title}
            className="mt-6 w-full rounded-2xl border border-border object-cover"
          />
        ) : null}
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card icon={<Target className="h-6 w-6" />} title={c.card_1_title} desc={c.card_1_desc} />
          <Card icon={<Heart className="h-6 w-6" />} title={c.card_2_title} desc={c.card_2_desc} />
          <Card icon={<Users className="h-6 w-6" />} title={c.card_3_title} desc={c.card_3_desc} />
        </div>
        <div className="mt-12 rounded-xl border border-border bg-card p-8">
          <h2 className="text-2xl font-bold">{c.story_title}</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{c.story_body}</p>
        </div>
      </section>
    </SiteLayout>
  );
}

function Card({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal/10 text-teal">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}