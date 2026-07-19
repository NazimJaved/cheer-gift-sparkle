import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Clock,
  User,
  Phone,
  Hash,
  Calendar,
  StickyNote,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCourseBySlug, formatPrice } from "@/lib/db-courses";

export const Route = createFileRoute("/courses/$slug/buy")({
  component: BuyCoursePage,
});

type MethodKey = "bkash" | "nagad" | "rocket";
type MethodInfo = { number: string; type?: string; instructions?: string };
type PaymentMethods = Record<MethodKey, MethodInfo>;

const METHOD_LABELS: Record<MethodKey, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

const METHOD_STYLES: Record<MethodKey, { bg: string; ring: string; dot: string; letter: string }> = {
  bkash: { bg: "bg-pink-50", ring: "ring-pink-500", dot: "bg-pink-500", letter: "bK" },
  nagad: { bg: "bg-orange-50", ring: "ring-orange-500", dot: "bg-orange-500", letter: "N" },
  rocket: { bg: "bg-purple-50", ring: "ring-purple-500", dot: "bg-purple-500", letter: "R" },
};

function BuyCoursePage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { course } = useCourseBySlug(slug);

  const [methods, setMethods] = useState<PaymentMethods | null>(null);
  const [method, setMethod] = useState<MethodKey>("bkash");
  const [senderName, setSenderName] = useState("");
  const [mobile, setMobile] = useState("");
  const [txnId, setTxnId] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [pendingExists, setPendingExists] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("data")
      .eq("key", "payment-methods")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.data) setMethods(data.data as PaymentMethods);
      });
  }, []);

  useEffect(() => {
    if (!user || !course) return;
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle()
      .then(({ data }) => setAlreadyEnrolled(!!data));
    supabase
      .from("payments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "pending")
      .maybeSingle()
      .then(({ data }) => setPendingExists(!!data));
  }, [user, course]);

  const price = useMemo(() => {
    if (!course) return 0;
    const p = course.price ?? 0;
    const d = course.discount_price;
    return d != null && d > 0 && d < p ? d : p;
  }, [course]);

  const currentMethod = methods?.[method];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !course) return;
    if (!senderName.trim() || !mobile.trim() || !txnId.trim() || !payDate) {
      toast.error("সব আবশ্যক তথ্য পূরণ করুন");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("payments").insert({
      user_id: user.id,
      course_id: course.id,
      amount: price,
      payment_method: method,
      transaction_id: txnId.trim(),
      sender_name: senderName.trim(),
      mobile_number: mobile.trim(),
      payment_date: payDate,
      note: note.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("পেমেন্ট জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।");
    navigate({ to: "/payments" });
  }

  if (authLoading || course === undefined) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-24 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      </SiteLayout>
    );
  }

  if (course === null) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">কোর্স পাওয়া যায়নি</h1>
          <Link to="/courses" className="mt-4 inline-flex items-center gap-2 text-teal hover:underline">
            <ArrowLeft className="h-4 w-4" /> সব কোর্স
          </Link>
        </div>
      </SiteLayout>
    );
  }

  if (alreadyEnrolled) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green" />
          <h1 className="mt-4 text-2xl font-bold">আপনি ইতিমধ্যে এনরোল্ড</h1>
          <Link
            to="/learn/$courseSlug"
            params={{ courseSlug: course.slug }}
            className="mt-6 inline-flex items-center rounded-md bg-teal px-4 py-2 text-sm text-teal-foreground"
          >
            কোর্স শুরু করুন
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-teal/10 via-green/5 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link
            to="/courses/$slug"
            params={{ slug: course.slug }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> কোর্সে ফিরুন
          </Link>

          <div className="mt-6 flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
              <Wallet className="h-3.5 w-3.5" /> সুরক্ষিত ম্যানুয়াল পেমেন্ট
            </span>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              পেমেন্ট মাধ্যম বেছে নিয়ে টাকা পাঠান, তারপর নিচের ফর্মে ট্রানজেকশন আইডি জমা দিন।
            </p>
          </div>

          {pendingExists ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <div>আপনার একটি পেমেন্ট এখনও পেন্ডিং। চাইলে আরেকটি জমা দিতে পারেন।</div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {/* Step 1 */}
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <header className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-6 py-4">
                  <StepBadge n={1} />
                  <div>
                    <div className="text-sm font-semibold">পেমেন্ট মাধ্যম বেছে নিন</div>
                    <div className="text-xs text-muted-foreground">bKash / Nagad / Rocket থেকে যেকোনো একটি</div>
                  </div>
                </header>
                <div className="p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(Object.keys(METHOD_LABELS) as MethodKey[]).map((m) => {
                      const s = METHOD_STYLES[m];
                      const active = method === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMethod(m)}
                          className={`group relative flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                            active
                              ? `${s.bg} border-transparent ring-2 ${s.ring}`
                              : "border-border bg-background hover:border-foreground/20 hover:bg-secondary/50"
                          }`}
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.dot} text-sm font-bold text-white`}>
                            {s.letter}
                          </span>
                          <span className="flex-1">
                            <span className="block text-sm font-semibold">{METHOD_LABELS[m]}</span>
                            <span className="block text-[11px] text-muted-foreground">মোবাইল ব্যাংকিং</span>
                          </span>
                          {active ? <CheckCircle2 className="h-5 w-5 text-teal" /> : null}
                        </button>
                      );
                    })}
                  </div>

                  {currentMethod ? (
                    <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/30 p-5">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">Send Money নম্বর</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-2xl font-bold tracking-tight">{currentMethod.number}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(currentMethod.number);
                                toast.success("নম্বর কপি হয়েছে");
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-secondary"
                            >
                              <Copy className="h-3 w-3" /> কপি
                            </button>
                          </div>
                          {currentMethod.type ? (
                            <div className="mt-1 text-xs text-muted-foreground">টাইপ: {currentMethod.type}</div>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">পরিমাণ</div>
                          <div className="text-2xl font-bold text-green">৳{price}</div>
                        </div>
                      </div>
                      {currentMethod.instructions ? (
                        <p className="mt-4 whitespace-pre-wrap border-t border-border/60 pt-4 text-sm text-muted-foreground">
                          {currentMethod.instructions}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Step 2 */}
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <header className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-6 py-4">
                  <StepBadge n={2} />
                  <div>
                    <div className="text-sm font-semibold">পেমেন্ট তথ্য জমা দিন</div>
                    <div className="text-xs text-muted-foreground">টাকা পাঠানোর পর ট্রানজেকশন আইডি লিখুন</div>
                  </div>
                </header>
                <form onSubmit={submit} className="space-y-5 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field icon={<User className="h-4 w-4" />} label="প্রেরকের নাম" required>
                      <input required value={senderName} onChange={(e) => setSenderName(e.target.value)} className="input" placeholder="আপনার নাম" />
                    </Field>
                    <Field icon={<Phone className="h-4 w-4" />} label="মোবাইল নম্বর" required>
                      <input required value={mobile} onChange={(e) => setMobile(e.target.value)} className="input" placeholder="01XXXXXXXXX" />
                    </Field>
                    <Field icon={<Hash className="h-4 w-4" />} label="ট্রানজেকশন আইডি" required>
                      <input required value={txnId} onChange={(e) => setTxnId(e.target.value)} className="input" placeholder="যেমন: 9AB12CDE34" />
                    </Field>
                    <Field icon={<Calendar className="h-4 w-4" />} label="পেমেন্ট তারিখ" required>
                      <input required type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input" />
                    </Field>
                    <Field icon={<StickyNote className="h-4 w-4" />} label="নোট (ঐচ্ছিক)" full>
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-[90px]" placeholder="অতিরিক্ত কিছু জানাতে চাইলে লিখুন" />
                    </Field>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal to-green px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal/20 transition hover:opacity-95 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    পেমেন্ট জমা দিন
                  </button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    জমা দেওয়ার পর অ্যাডমিন যাচাই করে ২৪ ঘন্টার মধ্যে কোর্স আনলক করবেন।
                  </p>
                </form>
              </section>
            </div>

            {/* Sidebar summary */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-gradient-to-br from-teal to-green px-6 py-5 text-white">
                  <div className="text-xs uppercase tracking-wide opacity-80">অর্ডার সামারি</div>
                  <div className="mt-1 line-clamp-2 text-lg font-semibold">{course.title}</div>
                </div>
                <div className="space-y-3 p-6 text-sm">
                  <Row label="কোর্স ফি" value={formatPrice(course.price, null)} muted={course.discount_price != null} />
                  {course.discount_price != null && course.discount_price > 0 ? (
                    <Row label="ডিসকাউন্ট" value={`- ৳${(course.price ?? 0) - course.discount_price}`} accent />
                  ) : null}
                  <div className="my-2 border-t border-dashed border-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">মোট প্রদেয়</span>
                    <span className="text-xl font-bold text-green">৳{price}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 text-sm">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-teal" /> কীভাবে কাজ করে
                </h3>
                <ol className="mt-4 space-y-3">
                  {[
                    "নির্দেশনা মেনে Send Money করুন",
                    "ট্রানজেকশন আইডিসহ ফর্ম জমা দিন",
                    "অ্যাডমিন অনুমোদনের পর কোর্স আনলক",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <style>{`
        .input { width: 100%; border: 1px solid hsl(var(--border)); border-radius: 6px; padding: 8px 10px; background: hsl(var(--background)); font-size: 14px; }
        .input:focus { outline: 2px solid hsl(var(--teal) / 0.4); }
      `}</style>
    </SiteLayout>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}