import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, PlayCircle, Award, CheckCircle2, User, Globe, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useCourseBySlug, useSignedCourseThumb, formatPrice } from "@/lib/db-courses";

export const Route = createFileRoute("/courses/$slug")({
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const { course, lessons } = useCourseBySlug(slug);
  const thumb = useSignedCourseThumb(course?.thumbnail ?? null);

  if (course === undefined) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">লোড হচ্ছে...</div>
      </SiteLayout>
    );
  }
  if (course === null) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">কোর্স পাওয়া যায়নি</h1>
          <p className="mt-3 text-muted-foreground">অনুরোধকৃত কোর্সটি বিদ্যমান নেই।</p>
          <Link to="/courses" className="mt-6 inline-flex items-center gap-2 text-teal hover:underline">
            <ArrowLeft className="h-4 w-4" /> সব কোর্স দেখুন
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-br from-teal/5 via-background to-green/10">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> সব কোর্স
          </Link>
          <div className="mt-6 grid gap-10 md:grid-cols-3">
            <div className="md:col-span-2">
              {course.level ? (
                <span className="inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">{course.level}</span>
              ) : null}
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{course.title}</h1>
              {course.short_description ? (
                <p className="mt-3 text-lg text-muted-foreground">{course.short_description}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {course.duration ? <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration}</span> : null}
                <span className="inline-flex items-center gap-1"><PlayCircle className="h-4 w-4" /> {course.total_lessons ?? lessons.length} লেসন</span>
                {course.language ? <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" /> {course.language}</span> : null}
                {course.instructor_name ? <span className="inline-flex items-center gap-1"><User className="h-4 w-4" /> {course.instructor_name}</span> : null}
              </div>
            </div>
            <aside className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-teal/20 to-green/30">
                {thumb ? (
                  <img src={thumb} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <PlayCircle className="h-14 w-14 text-teal" />
                )}
              </div>
              <div className="mt-5">
                <div className="text-2xl font-bold text-green">{formatPrice(course.price, course.discount_price)}</div>
                <p className="mt-1 text-xs text-muted-foreground">এনরোলমেন্ট অ্যাডমিন-অনুমোদিত</p>
              </div>
              <Link
                to="/courses/$slug/buy"
                params={{ slug: course.slug }}
                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90"
              >
                কোর্স কিনুন
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2 space-y-10">
            {course.description ? (
              <div>
                <h2 className="text-2xl font-bold">কোর্স পরিচিতি</h2>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground">{course.description}</p>
              </div>
            ) : null}
            {lessons.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold">কোর্স কারিকুলাম</h2>
                <div className="mt-4 space-y-2">
                  {lessons.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-teal" /> {l.title}
                      </span>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        {l.is_free_preview ? <span className="rounded bg-green/10 px-2 py-0.5 text-green">ফ্রি প্রিভিউ</span> : null}
                        {l.duration ? <span>{l.duration}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <aside>
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">কোর্স বিবরণ</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {course.category ? <li className="flex items-center gap-2"><Award className="h-4 w-4 text-teal" /> {course.category}</li> : null}
                {course.language ? <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-teal" /> {course.language}</li> : null}
                {course.instructor_name ? <li className="flex items-center gap-2"><User className="h-4 w-4 text-teal" /> {course.instructor_name}</li> : null}
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green" /> লাইফটাইম অ্যাক্সেস</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}