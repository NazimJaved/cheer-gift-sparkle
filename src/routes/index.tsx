import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BookOpen, Award, Users, PlayCircle, CheckCircle2, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const featured = courses[0];
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal/5 via-background to-green/10" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 text-xs font-medium text-teal">
                <Sparkles className="h-3.5 w-3.5" /> নতুন কোর্স উন্মোচিত
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                বাংলায় শিখুন,{" "}
                <span className="bg-gradient-to-r from-teal to-green bg-clip-text text-transparent">
                  ডিজিটাল দক্ষতায়
                </span>{" "}
                এগিয়ে যান
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                বাংলাদেশি শিক্ষার্থীদের জন্য পেশাদার অনলাইন কোর্স। যেকোনো জায়গা থেকে, নিজের গতিতে, মাতৃভাষায় শেখার সুযোগ।
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/courses" className="inline-flex items-center gap-2 rounded-md bg-teal px-5 py-3 text-sm font-medium text-teal-foreground shadow-sm transition hover:bg-teal/90">
                  <BookOpen className="h-4 w-4" /> কোর্স দেখুন
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-secondary">
                  আরও জানুন
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <Stat label="সক্রিয় শিক্ষার্থী" value="১,২০০+" />
                <Stat label="ভিডিও লেসন" value="৪৮" />
                <Stat label="সার্টিফিকেট" value="✓" />
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-teal/20 to-green/30">
                  <PlayCircle className="h-16 w-16 text-teal" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{featured.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{featured.subtitle}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{featured.lessons} লেসন</span>
                  <span>•</span>
                  <span>{featured.duration}</span>
                  <span>•</span>
                  <span>{featured.language}</span>
                </div>
                <Link to="/courses/$slug" params={{ slug: featured.slug }} className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-green px-4 py-2 text-sm font-medium text-green-foreground hover:bg-green/90">
                  বিস্তারিত দেখুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">কেন আমিনশিপ একাডেমি?</h2>
          <p className="mt-3 text-muted-foreground">আধুনিক পদ্ধতিতে, বাংলায়, আপনার সময়মতো।</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard icon={<BookOpen className="h-6 w-6" />} title="বাংলায় কনটেন্ট" desc="সমস্ত লেসন বাংলা ভাষায়, সহজবোধ্য উপস্থাপনায়।" />
          <FeatureCard icon={<Award className="h-6 w-6" />} title="সার্টিফিকেট" desc="কোর্স সম্পন্ন করলে পেশাদার সার্টিফিকেট।" />
          <FeatureCard icon={<Users className="h-6 w-6" />} title="বিশেষজ্ঞ শিক্ষক" desc="ইন্ডাস্ট্রি বিশেষজ্ঞদের কাছ থেকে সরাসরি শেখা।" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl bg-gradient-to-r from-teal to-green p-10 text-center text-white">
          <h2 className="text-3xl font-bold">আজই শেখা শুরু করুন</h2>
          <p className="mt-3 opacity-90">নতুন দক্ষতা অর্জন করে ক্যারিয়ারে এগিয়ে যান।</p>
          <Link to="/courses" className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-teal hover:bg-white/90">
            <CheckCircle2 className="h-4 w-4" /> কোর্স ব্রাউজ করুন
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
