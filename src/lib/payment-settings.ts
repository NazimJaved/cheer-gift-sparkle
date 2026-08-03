import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PAYMENT_CONTENT_KEY = "payment-methods";

export type MethodKey = "bkash" | "nagad" | "rocket";
export const METHOD_KEYS: MethodKey[] = ["bkash", "nagad", "rocket"];

export type MethodInfo = {
  label: string;
  number: string;
  type: string;
  instructions: string;
  enabled: boolean;
};

export type PaymentTexts = {
  page_subtitle: string;
  step1_title: string;
  step1_desc: string;
  step2_title: string;
  step2_desc: string;
  number_label: string;
  amount_label: string;
  how_title: string;
  how_step_1: string;
  how_step_2: string;
  how_step_3: string;
  pending_notice: string;
  submit_label: string;
};

export type PaymentSettings = Record<MethodKey, MethodInfo> & { texts: PaymentTexts };

export const DEFAULT_METHODS: Record<MethodKey, MethodInfo> = {
  bkash: {
    label: "bKash",
    number: "01XXXXXXXXX",
    type: "Personal",
    instructions: "bKash Personal নম্বরে Send Money করুন।",
    enabled: true,
  },
  nagad: {
    label: "Nagad",
    number: "01XXXXXXXXX",
    type: "Personal",
    instructions: "Nagad Personal নম্বরে Send Money করুন।",
    enabled: true,
  },
  rocket: {
    label: "Rocket",
    number: "01XXXXXXXXX0",
    type: "Personal",
    instructions: "Rocket নম্বরে টাকা পাঠান।",
    enabled: true,
  },
};

export const DEFAULT_TEXTS: PaymentTexts = {
  page_subtitle: "পেমেন্ট মাধ্যম বেছে নিয়ে টাকা পাঠান, তারপর নিচের ফর্মে ট্রানজেকশন আইডি জমা দিন।",
  step1_title: "পেমেন্ট মাধ্যম বেছে নিন",
  step1_desc: "bKash / Nagad / Rocket থেকে যেকোনো একটি",
  step2_title: "পেমেন্ট তথ্য জমা দিন",
  step2_desc: "টাকা পাঠানোর পর ট্রানজেকশন আইডি লিখুন",
  number_label: "Send Money নম্বর",
  amount_label: "পরিমাণ",
  how_title: "কীভাবে কাজ করে",
  how_step_1: "নির্দেশনা মেনে Send Money করুন",
  how_step_2: "ট্রানজেকশন আইডিসহ ফর্ম জমা দিন",
  how_step_3: "অ্যাডমিন অনুমোদনের পর কোর্স আনলক",
  pending_notice: "আপনার একটি পেমেন্ট এখনও পেন্ডিং। চাইলে আরেকটি জমা দিতে পারেন।",
  submit_label: "পেমেন্ট জমা দিন",
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  ...DEFAULT_METHODS,
  texts: DEFAULT_TEXTS,
};

export function normalizePaymentSettings(raw: unknown): PaymentSettings {
  const row = (raw ?? {}) as Record<string, unknown>;
  const methods = {} as Record<MethodKey, MethodInfo>;
  for (const k of METHOD_KEYS) {
    const m = (row[k] ?? {}) as Partial<MethodInfo>;
    methods[k] = {
      label: m.label?.toString().trim() || DEFAULT_METHODS[k].label,
      number: m.number?.toString() ?? DEFAULT_METHODS[k].number,
      type: m.type?.toString() ?? "",
      instructions: m.instructions?.toString() ?? "",
      enabled: m.enabled === undefined ? true : !!m.enabled,
    };
  }
  const t = (row["texts"] ?? {}) as Partial<PaymentTexts>;
  const texts = { ...DEFAULT_TEXTS };
  for (const key of Object.keys(DEFAULT_TEXTS) as (keyof PaymentTexts)[]) {
    const v = t[key];
    if (typeof v === "string" && v.trim()) texts[key] = v;
  }
  return { ...methods, texts };
}

export function usePaymentSettings(): { settings: PaymentSettings; loading: boolean } {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_content")
      .select("data")
      .eq("key", PAYMENT_CONTENT_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setSettings(normalizePaymentSettings(data?.data));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}

export async function savePaymentSettings(settings: PaymentSettings) {
  const { error } = await supabase
    .from("site_content")
    .upsert(
      { key: PAYMENT_CONTENT_KEY, data: settings as unknown as Record<string, unknown> },
      { onConflict: "key" },
    );
  if (error) throw error;
}