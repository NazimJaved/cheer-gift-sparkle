import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, PlayCircle, Award, BookOpen } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { usePublishedCourses, useSignedCourseThumb, type DbCourse } from "@/lib/db-courses";

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
      <section className="bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="mb-14 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              আমাদের <span className="text-teal">কোর্সসমূহ</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              আপনার আগ্রহের কোর্স বেছে নিন এবং আজই শেখা শুরু করুন। সব কোর্স বাংলা ভাষায় প্রস্তুতকৃত।
            </p>
            <div className="mx-auto mt-6 h-1.5 w-20 rounded-full bg-teal" />
          </div>
          {courses === null ? (
            <p className="text-center text-muted-foreground">লোড হচ্ছে...</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted-foreground">এখনো কোনো কোর্স প্রকাশিত হয়নি।</p>
          ) : (
            <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8">
              {courses.map((c) => (
                <div key={c.id} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.334rem)] max-w-sm">
                  <CourseCard c={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function CourseCard({ c }: { c: DbCourse }) {
  const thumb = useSignedCourseThumb(c.thumbnail);
  const hasDiscount =
    c.price != null && c.discount_price != null && c.discount_price > 0 && c.discount_price < c.price;
  const displayPrice = hasDiscount ? c.discount_price! : c.price;
  const isFree = c.price == null || c.price === 0;
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: c.slug }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-2xl"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-teal/20 to-green/30">
        {thumb ? (
          <img
            src={thumb}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <PlayCircle className="h-14 w-14 text-teal transition group-hover:scale-110" />
        )}
        {c.level ? (
          <span className="absolute left-4 top-4 rounded-full bg-teal px-4 py-1.5 text-sm font-medium text-white shadow-lg">
            {c.level}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-slate-800 transition-colors group-hover:text-teal">
          {c.title}
        </h3>
        {c.short_description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {c.short_description}
          </p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600">
          {c.duration ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal" />
              {c.duration}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal" />
            {c.total_lessons ?? 0}+ লেসন
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-green" />
            কোর্স শেষে সার্টিফিকেট
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-8">
          <div className="flex flex-col">
            {hasDiscount ? (
              <span className="text-xs font-medium text-slate-400 line-through">৳ {c.price}</span>
            ) : null}
            <span className="text-2xl font-bold text-teal">
              {isFree ? "ফ্রি" : `৳ ${displayPrice}`}
            </span>
          </div>
          <span className="rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all group-hover:bg-teal/90 group-hover:shadow-lg">
            বিস্তারিত
          </span>
        </div>
      </div>
    </Link>
  );
}