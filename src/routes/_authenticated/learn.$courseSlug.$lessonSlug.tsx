import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  Lock,
  PlayCircle,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Gauge,
  StickyNote,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { youtubeEmbedUrl, type Chapter, type Lesson } from "@/lib/lessons";

const NotesPanel = lazy(() => import("@/components/learn/notes-panel").then((m) => ({ default: m.NotesPanel })));
const ResourcesPanel = lazy(() =>
  import("@/components/learn/resources-panel").then((m) => ({ default: m.ResourcesPanel })),
);

export const Route = createFileRoute("/_authenticated/learn/$courseSlug/$lessonSlug")({
  component: LessonPlayerPage,
});

type CourseRow = { id: string; title: string; price: number; discount_price: number | null };

function LessonPlayerPage() {
  const { courseSlug, lessonSlug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [savingProgress, setSavingProgress] = useState(false);
  const [tab, setTab] = useState<"notes" | "resources">("notes");
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const savedInitial = useRef(false);

  const current = useMemo(() => lessons.find((l) => l.slug === lessonSlug) ?? null, [lessons, lessonSlug]);
  const currentIndex = useMemo(
    () => (current ? lessons.findIndex((l) => l.id === current.id) : -1),
    [current, lessons],
  );
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("courses")
        .select("id,title,price,discount_price")
        .eq("slug", courseSlug)
        .eq("published", true)
        .maybeSingle();
      if (!c) {
        setCourse(null);
        setLoading(false);
        return;
      }
      setCourse(c);

      let enrolledNow = false;
      if (user) {
        const { data: e } = await supabase
          .from("enrollments")
          .select("id")
          .eq("course_id", c.id)
          .eq("user_id", user.id)
          .maybeSingle();
        enrolledNow = !!e;
        setEnrolled(enrolledNow);
      }

      const { data: ls, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", c.id)
        .eq("is_published", true)
        .order("lesson_order", { ascending: true });
      if (error) toast.error(error.message);
      setLessons((ls ?? []) as Lesson[]);
      const { data: chs } = await supabase
        .from("course_chapters")
        .select("id,course_id,title,chapter_order")
        .eq("course_id", c.id)
        .order("chapter_order", { ascending: true });
      setChapters((chs ?? []) as Chapter[]);

      if (user && enrolledNow) {
        const { data: prog } = await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("user_id", user.id)
          .eq("course_id", c.id);
        setCompletedIds(new Set((prog ?? []).filter((p) => p.completed).map((p) => p.lesson_id)));
      }
      setLoading(false);
    })();
  }, [courseSlug, user]);

  // Track "last watched" whenever the current lesson changes and access is allowed.
  useEffect(() => {
    if (!user || !course || !current) return;
    const canView = enrolled || current.is_free_preview;
    if (!canView) return;
    if (savedInitial.current) return;
    savedInitial.current = true;
    (async () => {
      await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          course_id: course.id,
          lesson_id: current.id,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
    })();
  }, [user, course, current, enrolled]);

  // Reset "savedInitial" latch when lesson changes
  useEffect(() => {
    savedInitial.current = false;
  }, [lessonSlug]);

  // Auto-save last_watched_at heartbeat every 20s
  useEffect(() => {
    if (!user || !course || !current) return;
    const canView = enrolled || current.is_free_preview;
    if (!canView) return;
    const iv = setInterval(() => {
      supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            course_id: course.id,
            lesson_id: current.id,
            last_watched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" },
        )
        .then(() => {});
    }, 20000);
    return () => clearInterval(iv);
  }, [user, course, current, enrolled]);

  function goPrev() {
    if (prev) navigate({ to: "/learn/$courseSlug/$lessonSlug", params: { courseSlug, lessonSlug: prev.slug } });
  }
  function goNext() {
    if (next) navigate({ to: "/learn/$courseSlug/$lessonSlug", params: { courseSlug, lessonSlug: next.slug } });
  }
  function toggleFullscreen() {
    const el = playerWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }
  function setPlaybackRate(rate: number) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "setPlaybackRate", args: [rate] }),
      "*",
    );
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
      else if (e.key.toLowerCase() === "n") { e.preventDefault(); setTab("notes"); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markComplete() {
    if (!user || !course || !current) return;
    setSavingProgress(true);
    const isCompleted = completedIds.has(current.id);
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        course_id: course.id,
        lesson_id: current.id,
        completed: !isCompleted,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    setSavingProgress(false);
    if (error) return toast.error(error.message);
    const nextSet = new Set(completedIds);
    if (isCompleted) nextSet.delete(current.id);
    else nextSet.add(current.id);
    setCompletedIds(nextSet);
    if (!isCompleted) toast.success("লেসন সম্পন্ন হিসেবে চিহ্নিত হয়েছে");
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      </SiteLayout>
    );
  }

  if (!course) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">কোর্স পাওয়া যায়নি</h1>
        </div>
      </SiteLayout>
    );
  }

  if (!current) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">লেসন পাওয়া যায়নি</h1>
          <Link
            to="/learn/$courseSlug"
            params={{ courseSlug }}
            className="mt-6 inline-flex items-center gap-2 text-teal hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> কোর্সে ফিরুন
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const canView = enrolled || current.is_free_preview;
  const embed = youtubeEmbedUrl(current.youtube_url);
  const total = lessons.length;
  const done = completedIds.size;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const grouped: { chapter: Chapter | null; lessons: Lesson[] }[] = [
    ...chapters.map((c) => ({ chapter: c, lessons: lessons.filter((l) => l.chapter_id === c.id) })),
    { chapter: null, lessons: lessons.filter((l) => !l.chapter_id) },
  ].filter((g) => g.lessons.length > 0);
  const showChapterHeaders = chapters.length > 0;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/courses/$slug"
              params={{ slug: courseSlug }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> {course.title}
            </Link>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">{current.title}</h1>
            {current.is_free_preview && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green/15 px-2 py-0.5 text-[11px] font-medium text-green">
                <Sparkles className="h-3 w-3" /> ফ্রি প্রিভিউ
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="relative" ref={playerWrapRef}>
              {/* ambient glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-teal/30 via-green/20 to-teal/10 blur-3xl opacity-70"
              />
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
                {/* top chrome bar */}
                <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-black/90 via-black/70 to-black/90 px-4 py-2 text-xs text-white/70 backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="max-w-[60%] truncate font-medium">{current.title}</span>
                  <div className="flex items-center gap-1">
                    <PlaybackRateMenu onSelect={setPlaybackRate} />
                    <button
                      onClick={toggleFullscreen}
                      title="ফুলস্ক্রিন (F)"
                      className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {canView ? (
                  embed ? (
                    <LessonVideoFrame
                      embed={embed}
                      rawUrl={current.youtube_url}
                      title={current.title}
                      lessonId={current.id}
                      iframeRef={iframeRef}
                    />
                  ) : (
                    <UnparseableVideo rawUrl={current.youtube_url} />
                  )
                ) : (
                  <LockedPreview course={course} />
                )}
              </div>
            </div>

            {canView && (
              <>
                {current.short_description && (
                  <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {current.short_description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      disabled={!prev}
                      onClick={goPrev}
                      title="পূর্ববর্তী (←)"
                      className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" /> পূর্ববর্তী
                    </button>
                    <button
                      disabled={!next}
                      onClick={goNext}
                      title="পরবর্তী (→)"
                      className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary disabled:opacity-40"
                    >
                      পরবর্তী <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={markComplete}
                    disabled={savingProgress || !enrolled}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                      completedIds.has(current.id)
                        ? "bg-green/15 text-green hover:bg-green/25"
                        : "bg-teal text-teal-foreground hover:bg-teal/90"
                    } disabled:opacity-60`}
                    title={enrolled ? "" : "এনরোল হলে প্রগ্রেস সংরক্ষণ হবে"}
                  >
                    {savingProgress ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : completedIds.has(current.id) ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    {completedIds.has(current.id) ? "সম্পন্ন" : "সম্পন্ন হিসেবে চিহ্নিত করুন"}
                  </button>
                </div>

                {/* Notes / Resources tabs */}
                <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setTab("notes")}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium ${
                        tab === "notes" ? "border-b-2 border-teal text-teal" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <StickyNote className="h-4 w-4" /> নোট
                    </button>
                    <button
                      onClick={() => setTab("resources")}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium ${
                        tab === "resources" ? "border-b-2 border-teal text-teal" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="h-4 w-4" /> রিসোর্স
                    </button>
                  </div>
                  <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">লোড হচ্ছে...</div>}>
                    {tab === "notes" ? (
                      <NotesPanel lessonId={current.id} courseId={course.id} />
                    ) : (
                      <ResourcesPanel lessonId={current.id} />
                    )}
                  </Suspense>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  কীবোর্ড: ← পূর্ববর্তী · → পরবর্তী · F ফুলস্ক্রিন · N নোট
                </p>
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">কোর্স প্রগ্রেস</span>
                  <span className="text-muted-foreground">
                    {done}/{total}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-teal transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{progressPct}% সম্পন্ন</div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {grouped.map((g) => {
                  return (
                    <div key={g.chapter?.id ?? "__none"}>
                      {showChapterHeaders && (
                        <div className="sticky top-0 bg-gradient-to-r from-teal/10 via-teal/5 to-transparent px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-teal">
                          {g.chapter ? g.chapter.title : "অন্যান্য"}
                        </div>
                      )}
                      <ul className="divide-y divide-border">
                        {g.lessons.map((l) => {
                          const idx = lessons.findIndex((x) => x.id === l.id);
                          const isCurrent = l.id === current.id;
                          const isDone = completedIds.has(l.id);
                          const locked = !enrolled && !l.is_free_preview;
                          return (
                            <li key={l.id}>
                              <Link
                                to="/learn/$courseSlug/$lessonSlug"
                                params={{ courseSlug, lessonSlug: l.slug }}
                                className={`flex items-center gap-3 p-3 text-sm hover:bg-secondary ${isCurrent ? "bg-teal/10" : ""}`}
                              >
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className={`truncate ${isCurrent ? "font-semibold text-teal" : ""}`}>{l.title}</div>
                                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                    {l.duration && <span>{l.duration}</span>}
                                    {l.is_free_preview && (
                                      <span className="inline-flex items-center gap-0.5 text-green">
                                        <Sparkles className="h-3 w-3" /> প্রিভিউ
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {locked ? (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                ) : isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-green" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                {lessons.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">এখনও লেসন নেই</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function LockedPreview({ course }: { course: CourseRow }) {
  return _LockedPreview({ course });
}
function _LockedPreview({ course }: { course: CourseRow }) {
  const finalPrice = course.discount_price ?? course.price;
  return (
    <div className="grid aspect-video place-items-center bg-gradient-to-br from-teal/10 via-background to-green/10 p-8 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white/80 text-teal shadow">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">এই লেসনটি লক করা</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          "{course.title}" কোর্সে এনরোল হলে ভিডিও উন্মুক্ত হবে।
        </p>
        <div className="mt-3 text-2xl font-bold text-green">৳{finalPrice}</div>
        <Link
          to="/contact"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90"
        >
          এনরোলমেন্টের জন্য যোগাযোগ করুন
        </Link>
      </div>
    </div>
  );
}

function LessonVideoFrame({
  embed,
  rawUrl,
  title,
  lessonId,
  iframeRef,
}: {
  embed: string;
  rawUrl: string | null;
  title: string;
  lessonId: string;
  iframeRef?: React.MutableRefObject<HTMLIFrameElement | null>;
}) {
  void rawUrl;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus("loading");
  }, [lessonId, attempt]);

  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/20 text-white/80">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> ভিডিও লোড হচ্ছে...
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 rounded-lg border border-red-400/30 bg-black/80 px-4 py-3 text-sm text-white shadow-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <div>
              <p className="font-medium">ভিডিও লোড হতে সমস্যা হচ্ছে</p>
              <p className="mt-0.5 text-xs text-white/70">প্লেয়ারটি নিচে রাখা হয়েছে—প্লে না হলে YouTube-এ খুলুন।</p>
            </div>
          </div>
        </div>
      )}
      <iframe
        key={`${lessonId}-${attempt}`}
        ref={iframeRef}
        src={embed + "&enablejsapi=1"}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
      <div className="absolute bottom-3 right-3 z-20 flex gap-2">
        {status === "error" && (
          <button
            onClick={() => setAttempt((a) => a + 1)}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-2 text-xs font-medium text-teal-foreground shadow hover:bg-teal/90"
          >
            <RefreshCw className="h-3.5 w-3.5" /> আবার চেষ্টা
          </button>
        )}
      </div>
    </div>
  );
}

function UnparseableVideo({ rawUrl }: { rawUrl: string | null }) {
  if (!rawUrl) {
    return (
      <div className="grid aspect-video place-items-center bg-gradient-to-br from-slate-900 via-black to-slate-900 text-center text-white/70">
        <div>
          <PlayCircle className="mx-auto h-10 w-10 text-white/30" />
          <p className="mt-3 text-sm">এই লেসনে এখনো ভিডিও যুক্ত হয়নি</p>
        </div>
      </div>
    );
  }
  return (
    <VideoErrorState
      title="ভিডিও লিংক পড়া যায়নি"
      message="ভিডিও লিংকটি সঠিক ফরম্যাটে নেই। অ্যাডমিনকে সঠিক লিংক যুক্ত করতে অনুরোধ করুন।"
      rawUrl={rawUrl}
    />
  );
}

function VideoErrorState({
  title,
  message,
  rawUrl,
  onRetry,
}: {
  title: string;
  message: string;
  rawUrl: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="grid aspect-video place-items-center bg-gradient-to-br from-slate-900 via-black to-slate-900 p-6 text-center text-white">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-white/70">{message}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal px-3 py-2 text-xs font-medium text-teal-foreground hover:bg-teal/90"
            >
              <RefreshCw className="h-3.5 w-3.5" /> আবার চেষ্টা করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}