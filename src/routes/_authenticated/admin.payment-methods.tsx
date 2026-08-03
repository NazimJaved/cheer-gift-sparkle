import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_TEXTS,
  METHOD_KEYS,
  PAYMENT_CONTENT_KEY,
  normalizePaymentSettings,
  savePaymentSettings,
  type MethodInfo,
  type MethodKey,
  type PaymentSettings,
  type PaymentTexts,
} from "@/lib/payment-settings";

export const Route = createFileRoute("/_authenticated/admin/payment-methods")({
  component: AdminPaymentMethods,
});

const TEXT_LABELS: Record<keyof PaymentTexts, string> = {
  page_subtitle: "পেজ সাবটাইটেল",
  step1_title: "ধাপ ১ — শিরোনাম",
  step1_desc: "ধাপ ১ — বিবরণ",
  step2_title: "ধাপ ২ — শিরোনাম",
  step2_desc: "ধাপ ২ — বিবরণ",
  number_label: "নম্বরের লেবেল",
  amount_label: "পরিমাণের লেবেল",
  how_title: "\"কীভাবে কাজ করে\" শিরোনাম",
  how_step_1: "কীভাবে কাজ করে — ধাপ ১",
  how_step_2: "কীভাবে কাজ করে — ধাপ ২",
  how_step_3: "কীভাবে কাজ করে — ধাপ ৩",
  pending_notice: "পেন্ডিং পেমেন্ট নোটিশ",
  submit_label: "সাবমিট বাটনের টেক্সট",
};

const LONG_TEXT: (keyof PaymentTexts)[] = ["page_subtitle", "pending_notice"];

const ACCENT: Record<MethodKey, string> = {
  bkash: "bg-pink-500",
  nagad: "bg-orange-500",
  rocket: "bg-purple-500",
};

function AdminPaymentMethods() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("data")
      .eq("key", PAYMENT_CONTENT_KEY)
      .maybeSingle()
      .then(({ data }) => setSettings(normalizePaymentSettings(data?.data)));
  }, []);

  function setMethod(key: MethodKey, patch: Partial<MethodInfo>) {
    setSettings((s) => (s ? { ...s, [key]: { ...s[key], ...patch } } : s));
  }

  function setText(key: keyof PaymentTexts, value: string) {
    setSettings((s) => (s ? { ...s, texts: { ...s.texts, [key]: value } } : s));
  }

  async function onSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await savePaymentSettings(settings);
      toast.success("পেমেন্ট সেটিংস সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Wallet className="h-5 w-5 text-teal" /> পেমেন্ট সেটিংস
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            bKash, Nagad, Rocket নম্বর, নির্দেশনা এবং পেমেন্ট পেজের সব টেক্সট এখান থেকে এডিট করুন।
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সংরক্ষণ করুন
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {METHOD_KEYS.map((k) => {
          const m = settings[k];
          return (
            <section key={k} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${ACCENT[k]} text-sm font-bold text-white`}>
                    {m.label.slice(0, 2)}
                  </span>
                  <div className="font-semibold">{m.label || k}</div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => setMethod(k, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-teal"
                  />
                  পেমেন্ট পেজে দেখানো হবে
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <LabeledInput label="নাম / লেবেল" value={m.label} onChange={(v) => setMethod(k, { label: v })} />
                <LabeledInput label="নম্বর" value={m.number} onChange={(v) => setMethod(k, { number: v })} />
                <LabeledInput
                  label="অ্যাকাউন্ট টাইপ (Personal / Merchant)"
                  value={m.type}
                  onChange={(v) => setMethod(k, { type: v })}
                />
              </div>
              <label className="mt-4 block text-sm">
                <span className="mb-1.5 block font-medium">নির্দেশনা</span>
                <textarea
                  value={m.instructions}
                  onChange={(e) => setMethod(k, { instructions: e.target.value })}
                  className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </section>
          );
        })}
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">পেমেন্ট পেজের টেক্সট</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(Object.keys(DEFAULT_TEXTS) as (keyof PaymentTexts)[]).map((key) =>
            LONG_TEXT.includes(key) ? (
              <label key={key} className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">{TEXT_LABELS[key]}</span>
                <textarea
                  value={settings.texts[key]}
                  onChange={(e) => setText(key, e.target.value)}
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            ) : (
              <LabeledInput
                key={key}
                label={TEXT_LABELS[key]}
                value={settings.texts[key]}
                onChange={(v) => setText(key, v)}
              />
            ),
          )}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সংরক্ষণ করুন
        </button>
        <button
          onClick={() => setSettings(DEFAULT_PAYMENT_SETTINGS)}
          className="rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary"
        >
          ডিফল্টে ফিরুন
        </button>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}