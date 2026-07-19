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
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/courses/$slug"
          params={{ slug: course.slug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> কোর্সে ফিরুন
        </Link>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">কোর্স কিনতে নিচের নির্দেশনা অনুসরণ করুন।</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">মোট মূল্য:</span>
                <span className="text-2xl font-bold text-green">{formatPrice(course.price, course.discount_price)}</span>
              </div>
            </div>

            {pendingExists ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                আপনার একটি পেমেন্ট এখনও পেন্ডিং। আপনি চাইলে আরেকটি জমা দিতে পারেন।
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">১. পেমেন্ট মাধ্যম বেছে নিন</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(Object.keys(METHOD_LABELS) as MethodKey[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition ${
                      method === m ? "border-teal bg-teal/10 text-teal" : "border-border hover:bg-secondary"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> {METHOD_LABELS[m]}
                  </button>
                ))}
              </div>

              {currentMethod ? (
                <div className="mt-4 rounded-lg bg-secondary/50 p-4 text-sm">
                  <div className="font-medium">নির্দেশনা ({METHOD_LABELS[method]})</div>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{currentMethod.instructions}</p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">নম্বর</div>
                      <div className="font-mono text-base font-semibold">{currentMethod.number}</div>
                    </div>
                    {currentMethod.type ? (
                      <div>
                        <div className="text-xs text-muted-foreground">অ্যাকাউন্ট টাইপ</div>
                        <div>{currentMethod.type}</div>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs text-muted-foreground">পরিমাণ</div>
                      <div className="font-semibold text-green">৳{price}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">২. পেমেন্ট তথ্য জমা দিন</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="প্রেরকের নাম *">
                  <input required value={senderName} onChange={(e) => setSenderName(e.target.value)} className="input" />
                </Field>
                <Field label="মোবাইল নম্বর *">
                  <input required value={mobile} onChange={(e) => setMobile(e.target.value)} className="input" placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="ট্রানজেকশন আইডি *">
                  <input required value={txnId} onChange={(e) => setTxnId(e.target.value)} className="input" />
                </Field>
                <Field label="পেমেন্ট তারিখ *">
                  <input required type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input" />
                </Field>
                <Field label="নোট (ঐচ্ছিক)" full>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-[80px]" />
                </Field>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                পেমেন্ট জমা দিন
              </button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 text-sm">
              <h3 className="font-semibold">কীভাবে কাজ করে</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-muted-foreground">
                <li>নির্দেশনা মেনে টাকা পাঠান</li>
                <li>ট্রানজেকশন আইডিসহ ফর্ম জমা দিন</li>
                <li>অ্যাডমিন অনুমোদনের পর কোর্স আনলক</li>
              </ol>
            </div>
          </aside>
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