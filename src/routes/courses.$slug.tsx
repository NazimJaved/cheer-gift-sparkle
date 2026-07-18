import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Clock, PlayCircle, Award, CheckCircle2, User, Globe, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { getCourse, type Course } from "@/lib/courses";

export const Route = createFileRoute("/courses/$slug")({
  loader: ({ params }) => {
    const course = getCourse(params.slug);
    if (!course) throw notFound();
    return { course } as { course: Course };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.course.title} — আমিনশিপ একাডেমি` },
          { name: "description", content: loaderData.course.subtitle },
          { property: "og:title", content: loaderData.course.title },
          { property: "og:description", content: loaderData.course.subtitle },
        ]
      : [{ title: "কোর্স পাওয়া যায়নি" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
  component: CourseDetail,
});

function NotFound() {
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

function ErrorView() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">একটি সমস্যা হয়েছে</h1>
        <p className="mt-3 text-muted-foreground">পৃষ্ঠাটি লোড করতে সমস্যা হয়েছে।</p>
      </div>
    </SiteLayout>
  );
}

function CourseDetail() {
  const { course } = Route.useLoaderData();
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-teal/5 via-background to-green/10">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> সব কোর্স
          </Link>
          <div className="mt-6 grid gap-10 md:grid-cols-3">
            <div className="md:col-span-2">
              <span className="inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">{course.level}</span>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{course.title}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{course.subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration}</span>
                <span className="inline-flex items-center gap-1"><PlayCircle className="h-4 w-4" /> {course.lessons} লেসন</span>
                <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" /> {course.language}</span>
                <span className="inline-flex items-center gap-1"><User className="h-4 w-4" /> {course.instructor}</span>
              </div>
            </div>
            <aside className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-teal/20 to-green/30">
                <PlayCircle className="h-14 w-14 text-teal" />
              </div>
              <div className="mt-5">
                <div className="text-2xl font-bold text-green">{course.price}</div>
                <p className="mt-1 text-xs text-muted-foreground">এনরোলমেন্ট অ্যাডমিন-অনুমোদিত</p>
              </div>
              <button
                type="button"
                disabled
                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground opacity-70"
              >
                শীঘ্রই এনরোলমেন্ট চালু হচ্ছে
              </button>
              <Link to="/contact" className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary">
                অ্যাক্সেসের জন্য যোগাযোগ করুন
              </Link>
              <ul className="mt-6 space-y-2 text-sm">
                {course.highlights.map((h: string) => (
                  <li key={h} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2 space-y-10">
            <div>
              <h2 className="text-2xl font-bold">কোর্স পরিচিতি</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{course.description}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">কী শিখবেন</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o: string) => (
                  <li key={o} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold">কোর্স কারিকুলাম</h2>
              <div className="mt-4 space-y-3">
                {course.curriculum.map((m: { module: string; lessons: string[] }) => (
                  <div key={m.module} className="rounded-lg border border-border bg-card p-4">
                    <h3 className="font-semibold">{m.module}</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {m.lessons.map((l: string) => (
                        <li key={l} className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-teal" /> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside>
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">এই কোর্স কার জন্য</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {course.audience.map((a: string) => (
                  <li key={a} className="flex items-start gap-2">
                    <Award className="mt-0.5 h-4 w-4 text-teal" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}