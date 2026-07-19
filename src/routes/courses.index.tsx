import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, PlayCircle, Award } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { usePublishedCourses, useSignedCourseThumb, formatPrice, type DbCourse } from "@/lib/db-courses";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "কোর্সসমূহ — আমিনশিপ একাডেমি" },
      { name: "description", content: "বাংলাদেশি শিক্ষার্থীদের জন্য বাংলা ভাষার অনলাইন কোর্স তালিকা।" },
      { property: "og:title", content: "কোর্সসমূহ — আমিনশিপ একাডেমি" },
      { property: "og:description", content: "বাংলা ভাষায় পেশাদার অনলাইন কোর্স।" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const courses = usePublishedCourses();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">আমাদের কোর্সসমূহ</h1>
          <p className="mt-3 text-muted-foreground">
            আপনার আগ্রহের কোর্স বেছে নিন এবং আজই শেখা শুরু করুন। সব কোর্স বাংলা ভাষায় প্রস্তুতকৃত।
          </p>
        </div>
        {courses === null ? (
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground">এখনো কোনো কোর্স প্রকাশিত হয়নি।</p>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} c={c} />
          ))}
        </div>
        )}
      </section>
    </SiteLayout>
  );
}

function CourseCard({ c }: { c: DbCourse }) {
  const thumb = useSignedCourseThumb(c.thumbnail);
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: c.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-teal/20 to-green/30">
        {thumb ? (
          <img src={thumb} alt={c.title} className="h-full w-full object-cover" />
        ) : (
          <PlayCircle className="h-14 w-14 text-teal transition group-hover:scale-110" />
        )}
        {c.level ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-teal">
            {c.level}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold">{c.title}</h3>
        {c.short_description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.short_description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {c.duration ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration}</span> : null}
          <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {c.total_lessons ?? 0} লেসন</span>
          <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" /> সার্টিফিকেট</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold text-green">{formatPrice(c.price, c.discount_price)}</span>
          <span className="text-sm font-medium text-teal group-hover:underline">বিস্তারিত →</span>
        </div>
      </div>
    </Link>
  );
}