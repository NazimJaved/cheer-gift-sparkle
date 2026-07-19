import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BookOpen, Award, Users, PlayCircle, CheckCircle2, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent, useSignedImage } from "@/lib/site-content";
import { usePublishedCourses, useSignedCourseThumb } from "@/lib/db-courses";
import { usePageBlocks } from "@/lib/page-blocks";
import { BlockRenderer } from "@/components/editor/block-renderer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const dbCourses = usePublishedCourses();
  const featured = dbCourses?.[0] ?? null;
  const c = useSiteContent("home");
  const heroImg = useSignedImage(c.hero_image);
  const featuredThumb = useSignedCourseThumb(featured?.thumbnail ?? null);
  const blocks = usePageBlocks("home");
  if (blocks && blocks.length > 0) {
    return (
      <SiteLayout>
        <BlockRenderer blocks={blocks} />
      </SiteLayout>
    );
  }
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal/5 via-background to-green/10" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 text-xs font-medium text-teal">
                <Sparkles className="h-3.5 w-3.5" /> {c.hero_badge}
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                {c.hero_title_1}{" "}
                <span className="bg-gradient-to-r from-teal to-green bg-clip-text text-transparent">
                  {c.hero_title_highlight}
                </span>{" "}
                {c.hero_title_2}
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                {c.hero_subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/courses" className="inline-flex items-center gap-2 rounded-md bg-teal px-5 py-3 text-sm font-medium text-teal-foreground shadow-sm transition hover:bg-teal/90">
                  <BookOpen className="h-4 w-4" /> {c.hero_cta_primary}
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-secondary">
                  {c.hero_cta_secondary}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <Stat label={c.stat_1_label} value={c.stat_1_value} />
                <Stat label={c.stat_2_label} value={c.stat_2_value} />
                <Stat label={c.stat_3_label} value={c.stat_3_value} />
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                {(() => {
                  const img = featuredThumb ?? heroImg;
                  return img ? (
                    <img src={img} alt={featured?.title ?? "featured"} className="aspect-video w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-teal/20 to-green/30">
                      <PlayCircle className="h-16 w-16 text-teal" />
                    </div>
                  );
                })()}
                {featured ? (
                  <>
                    <h3 className="mt-4 text-lg font-semibold">{featured.title}</h3>
                    {featured.short_description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{featured.short_description}</p>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{featured.total_lessons ?? 0} লেসন</span>
                      {featured.duration ? <><span>•</span><span>{featured.duration}</span></> : null}
                      {featured.language ? <><span>•</span><span>{featured.language}</span></> : null}
                    </div>
                    <Link to="/courses/$slug" params={{ slug: featured.slug }} className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-green px-4 py-2 text-sm font-medium text-green-foreground hover:bg-green/90">
                      বিস্তারিত দেখুন
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="mt-4 text-lg font-semibold">শীঘ্রই আসছে</h3>
                    <p className="mt-1 text-sm text-muted-foreground">প্রথম কোর্স শীঘ্রই প্রকাশিত হবে।</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{c.features_title}</h2>
          <p className="mt-3 text-muted-foreground">{c.features_subtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard icon={<BookOpen className="h-6 w-6" />} title={c.feature_1_title} desc={c.feature_1_desc} />
          <FeatureCard icon={<Award className="h-6 w-6" />} title={c.feature_2_title} desc={c.feature_2_desc} />
          <FeatureCard icon={<Users className="h-6 w-6" />} title={c.feature_3_title} desc={c.feature_3_desc} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl bg-gradient-to-r from-teal to-green p-10 text-center text-white">
          <h2 className="text-3xl font-bold">{c.cta_title}</h2>
          <p className="mt-3 opacity-90">{c.cta_subtitle}</p>
          <Link to="/courses" className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-teal hover:bg-white/90">
            <CheckCircle2 className="h-4 w-4" /> {c.cta_button}
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-teal">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition hover:shadow-md">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal/10 text-teal">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
