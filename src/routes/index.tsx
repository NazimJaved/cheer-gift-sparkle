import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BookOpen, Award, Users, PlayCircle, CheckCircle2, Sparkles, Clock } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent, useSignedImage } from "@/lib/site-content";
import { usePublishedCourses, useSignedCourseThumb, formatPrice, type DbCourse } from "@/lib/db-courses";
import { usePageBlocks } from "@/lib/page-blocks";
import { BlockRenderer } from "@/components/editor/block-renderer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JB IT Academy — বাংলায় ডিজিটাল দক্ষতা শিখুন" },
      { name: "description", content: "বাংলাদেশি শিক্ষার্থীদের জন্য বাংলা ভাষার পেশাদার অনলাইন কোর্স। যেকোনো জায়গা থেকে, নিজের গতিতে, মাতৃভাষায় শেখার সুযোগ।" },
      { property: "og:title", content: "JB IT Academy — বাংলায় ডিজিটাল দক্ষতা শিখুন" },
      { property: "og:description", content: "বাংলাদেশি শিক্ষার্থীদের জন্য বাংলা ভাষার পেশাদার অনলাইন কোর্স।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const dbCourses = usePublishedCourses();
  const c = useSiteContent("home");
  const heroImg = useSignedImage(c.hero_image);
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
      {/* Hero with banner */}
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
              {heroImg ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                  <img src={heroImg} alt="JB IT Academy banner" className="aspect-video w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-teal/20 to-green/30 shadow-xl">
                  <PlayCircle className="h-16 w-16 text-teal" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Courses grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">আমাদের <span className="text-teal">কোর্সসমূহ</span></h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">আপনার আগ্রহের কোর্স বেছে নিন এবং আজই শেখা শুরু করুন।</p>
          <div className="mx-auto mt-6 h-1.5 w-20 rounded-full bg-teal" />
        </div>
        {dbCourses === null ? (
          <p className="text-center text-muted-foreground">লোড হচ্ছে...</p>
        ) : dbCourses.length === 0 ? (
          <p className="text-center text-muted-foreground">এখনো কোনো কোর্স প্রকাশিত হয়নি।</p>
        ) : (
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8">
            {dbCourses.map((course) => (
              <div key={course.id} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.334rem)] max-w-sm">
                <HomeCourseCard c={course} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 text-center">
          <Link to="/courses" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-secondary">
            সব কোর্স দেখুন <BookOpen className="h-4 w-4" />
          </Link>
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

function HomeCourseCard({ c }: { c: DbCourse }) {
  const thumb = useSignedCourseThumb(c.thumbnail);
  const hasDiscount =
    c.price != null && c.discount_price != null && c.discount_price > 0 && c.discount_price < c.price;
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: c.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-teal/20 to-green/30">
        {thumb ? (
          <img src={thumb} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <PlayCircle className="h-14 w-14 text-teal transition group-hover:scale-110" />
        )}
        {c.level ? (
          <span className="absolute left-4 top-4 rounded-full bg-teal px-4 py-1.5 text-sm font-medium text-teal-foreground shadow-lg">
            {c.level}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold transition-colors group-hover:text-teal">{c.title}</h3>
        {c.short_description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.short_description}</p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-y-3 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          {c.duration ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal" /> {c.duration}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal" /> {c.total_lessons ?? 0}+ লেসন
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-green" /> কোর্স শেষে সার্টিফিকেট
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-8">
          <div className="flex flex-col">
            {hasDiscount ? (
              <span className="text-xs font-medium text-muted-foreground line-through">৳ {c.price}</span>
            ) : null}
            <span className="text-2xl font-bold text-teal">{formatPrice(c.price, c.discount_price)}</span>
          </div>
          <span className="rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-teal-foreground shadow-md transition-all group-hover:bg-teal/90 group-hover:shadow-lg">
            বিস্তারিত
          </span>
        </div>
      </div>
    </Link>
  );
}
