import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FieldType = "text" | "textarea" | "image";

export interface ContentField {
  key: string;
  label: string;
  type: FieldType;
}

export interface PageSchema {
  key: string;
  label: string;
  fields: ContentField[];
}

export const SITE_CONTENT_DEFAULTS: Record<string, Record<string, string>> = {
  home: {
    hero_badge: "নতুন কোর্স উন্মোচিত",
    hero_image: "",
    hero_title_1: "বাংলায় শিখুন,",
    hero_title_highlight: "ডিজিটাল দক্ষতায়",
    hero_title_2: "এগিয়ে যান",
    hero_subtitle:
      "বাংলাদেশি শিক্ষার্থীদের জন্য পেশাদার অনলাইন কোর্স। যেকোনো জায়গা থেকে, নিজের গতিতে, মাতৃভাষায় শেখার সুযোগ।",
    hero_cta_primary: "কোর্স দেখুন",
    hero_cta_secondary: "আরও জানুন",
    stat_1_label: "সক্রিয় শিক্ষার্থী",
    stat_1_value: "১,২০০+",
    stat_2_label: "ভিডিও লেসন",
    stat_2_value: "৪৮",
    stat_3_label: "সার্টিফিকেট",
    stat_3_value: "✓",
    features_title: "কেন আমিনশিপ একাডেমি?",
    features_subtitle: "আধুনিক পদ্ধতিতে, বাংলায়, আপনার সময়মতো।",
    feature_1_title: "বাংলায় কনটেন্ট",
    feature_1_desc: "সমস্ত লেসন বাংলা ভাষায়, সহজবোধ্য উপস্থাপনায়।",
    feature_2_title: "সার্টিফিকেট",
    feature_2_desc: "কোর্স সম্পন্ন করলে পেশাদার সার্টিফিকেট।",
    feature_3_title: "বিশেষজ্ঞ শিক্ষক",
    feature_3_desc: "ইন্ডাস্ট্রি বিশেষজ্ঞদের কাছ থেকে সরাসরি শেখা।",
    cta_title: "আজই শেখা শুরু করুন",
    cta_subtitle: "নতুন দক্ষতা অর্জন করে ক্যারিয়ারে এগিয়ে যান।",
    cta_button: "কোর্স ব্রাউজ করুন",
  },
  about: {
    title: "আমাদের সম্পর্কে",
    hero_image: "",
    intro:
      "আমিনশিপ একাডেমি বাংলাদেশি শিক্ষার্থীদের জন্য একটি আধুনিক অনলাইন শিক্ষা প্ল্যাটফর্ম। আমরা বিশ্বাস করি, মাতৃভাষায় শেখার সুযোগ পেলে প্রতিটি শিক্ষার্থী তার সর্বোচ্চ সম্ভাবনায় পৌঁছাতে পারে।",
    card_1_title: "আমাদের লক্ষ্য",
    card_1_desc: "মানসম্মত, প্রাসঙ্গিক এবং সাশ্রয়ী অনলাইন কোর্স প্রদান করা।",
    card_2_title: "আমাদের মূল্যবোধ",
    card_2_desc: "স্বচ্ছতা, শিক্ষার্থী-কেন্দ্রিকতা এবং ধারাবাহিক মান।",
    card_3_title: "আমাদের কমিউনিটি",
    card_3_desc: "সারাদেশের হাজারো শিক্ষার্থী ও শিক্ষকের সক্রিয় নেটওয়ার্ক।",
    story_title: "আমাদের গল্প",
    story_body:
      "ভূমি জরিপ ও ডিজিটাল আমিনশিপের মতো গুরুত্বপূর্ণ পেশাগত দক্ষতা বাংলা ভাষায় শেখার মানসম্মত রিসোর্সের অভাব দেখে আমরা এই একাডেমি প্রতিষ্ঠা করি। আমাদের লক্ষ্য প্রতিটি বাংলাদেশি যেন নিজের ভাষায়, নিজের গতিতে, পেশাদার দক্ষতা অর্জন করতে পারেন।",
  },
  contact: {
    title: "যোগাযোগ করুন",
    subtitle: "আপনার প্রশ্ন, মতামত বা এনরোলমেন্ট অনুরোধ আমাদের জানান।",
    email: "info@aminship.academy",
    phone: "+৮৮০ ১৭০০ ০০০০০০",
    address: "ঢাকা, বাংলাদেশ",
  },
  privacy: {
    title: "গোপনীয়তা নীতি",
    updated: "সর্বশেষ আপডেট: ২০২৬",
    intro:
      "এই পৃষ্ঠাটি আমিনশিপ একাডেমি কর্তৃক পরিচালিত। এখানে বর্ণিত তথ্যগুলি আমাদের প্ল্যাটফর্মে আপনার তথ্য কীভাবে পরিচালিত হয় তা ব্যাখ্যা করে।",
    s1_title: "আমরা কী তথ্য সংগ্রহ করি",
    s1_body: "অ্যাকাউন্ট তৈরি ও কোর্স অ্যাক্সেসের জন্য প্রয়োজনীয় তথ্য যেমন নাম, ইমেইল ও প্রোফাইল তথ্য।",
    s2_title: "তথ্যের ব্যবহার",
    s2_body: "আপনার শেখার অভিজ্ঞতা উন্নত করা, অ্যাক্সেস প্রদান এবং গুরুত্বপূর্ণ ঘোষণা পাঠানোর জন্য।",
    s3_title: "তথ্যের সুরক্ষা",
    s3_body: "আমরা যুক্তিসঙ্গত প্রশাসনিক ও প্রযুক্তিগত ব্যবস্থার মাধ্যমে আপনার তথ্য সুরক্ষিত রাখি।",
    s4_title: "তৃতীয় পক্ষ",
    s4_body: "প্রয়োজনীয় সেবা প্রদানকারীদের (যেমন হোস্টিং ও ইমেইল) সাথে সীমিত তথ্য শেয়ার করা হতে পারে।",
    s5_title: "আপনার অধিকার",
    s5_body: "আপনি যেকোনো সময় আপনার তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার অনুরোধ করতে পারেন।",
    s6_title: "যোগাযোগ",
    s6_body: "এই নীতি সম্পর্কে কোনো প্রশ্ন থাকলে info@aminship.academy ঠিকানায় যোগাযোগ করুন।",
  },
  terms: {
    title: "শর্তাবলী",
    updated: "সর্বশেষ আপডেট: ২০২৬",
    intro: "আমিনশিপ একাডেমি ব্যবহার করে আপনি নিম্নলিখিত শর্তাবলী মেনে চলতে সম্মত হচ্ছেন।",
    s1_title: "অ্যাকাউন্ট",
    s1_body: "সঠিক তথ্য দিয়ে অ্যাকাউন্ট তৈরি ও নিরাপত্তা রক্ষার দায়িত্ব ব্যবহারকারীর।",
    s2_title: "কনটেন্ট ব্যবহার",
    s2_body: "কোর্স কনটেন্ট শুধুমাত্র ব্যক্তিগত শেখার জন্য; পুনঃবিতরণ নিষিদ্ধ।",
    s3_title: "পেমেন্ট",
    s3_body: "পেমেন্ট সম্পন্ন হলে সংশ্লিষ্ট কোর্সে অ্যাক্সেস প্রদান করা হবে।",
    s4_title: "দায়বদ্ধতা",
    s4_body: 'সেবা "যেভাবে আছে" ভিত্তিতে প্রদান করা হয়; ফলাফলের নিশ্চয়তা নেই।',
    s5_title: "পরিবর্তন",
    s5_body: "শর্তাবলী পরিবর্তনের অধিকার আমাদের রয়েছে; পরিবর্তন এই পৃষ্ঠায় প্রকাশিত হবে।",
  },
};

const T = (key: string, label: string): ContentField => ({ key, label, type: "text" });
const TA = (key: string, label: string): ContentField => ({ key, label, type: "textarea" });
const IMG = (key: string, label: string): ContentField => ({ key, label, type: "image" });

export const SITE_CONTENT_SCHEMA: PageSchema[] = [
  {
    key: "home",
    label: "হোম পেজ",
    fields: [
      T("hero_badge", "হিরো ব্যাজ"),
      IMG("hero_image", "হিরো ইমেজ"),
      T("hero_title_1", "হিরো টাইটেল (অংশ ১)"),
      T("hero_title_highlight", "হিরো টাইটেল (হাইলাইট)"),
      T("hero_title_2", "হিরো টাইটেল (অংশ ২)"),
      TA("hero_subtitle", "হিরো সাবটাইটেল"),
      T("hero_cta_primary", "প্রাইমারি বাটন"),
      T("hero_cta_secondary", "সেকেন্ডারি বাটন"),
      T("stat_1_label", "স্ট্যাট ১ — লেবেল"),
      T("stat_1_value", "স্ট্যাট ১ — মান"),
      T("stat_2_label", "স্ট্যাট ২ — লেবেল"),
      T("stat_2_value", "স্ট্যাট ২ — মান"),
      T("stat_3_label", "স্ট্যাট ৩ — লেবেল"),
      T("stat_3_value", "স্ট্যাট ৩ — মান"),
      T("features_title", "ফিচার সেকশন টাইটেল"),
      T("features_subtitle", "ফিচার সেকশন সাবটাইটেল"),
      T("feature_1_title", "ফিচার ১ — শিরোনাম"),
      TA("feature_1_desc", "ফিচার ১ — বিবরণ"),
      T("feature_2_title", "ফিচার ২ — শিরোনাম"),
      TA("feature_2_desc", "ফিচার ২ — বিবরণ"),
      T("feature_3_title", "ফিচার ৩ — শিরোনাম"),
      TA("feature_3_desc", "ফিচার ৩ — বিবরণ"),
      T("cta_title", "CTA শিরোনাম"),
      TA("cta_subtitle", "CTA সাবটাইটেল"),
      T("cta_button", "CTA বাটন"),
    ],
  },
  {
    key: "about",
    label: "আমাদের সম্পর্কে",
    fields: [
      T("title", "শিরোনাম"),
      IMG("hero_image", "হিরো ইমেজ"),
      TA("intro", "ভূমিকা"),
      T("card_1_title", "কার্ড ১ — শিরোনাম"),
      TA("card_1_desc", "কার্ড ১ — বিবরণ"),
      T("card_2_title", "কার্ড ২ — শিরোনাম"),
      TA("card_2_desc", "কার্ড ২ — বিবরণ"),
      T("card_3_title", "কার্ড ৩ — শিরোনাম"),
      TA("card_3_desc", "কার্ড ৩ — বিবরণ"),
      T("story_title", "গল্প শিরোনাম"),
      TA("story_body", "গল্পের বডি"),
    ],
  },
  {
    key: "contact",
    label: "যোগাযোগ",
    fields: [
      T("title", "শিরোনাম"),
      TA("subtitle", "সাবটাইটেল"),
      T("email", "ইমেইল"),
      T("phone", "ফোন"),
      T("address", "ঠিকানা"),
    ],
  },
  {
    key: "privacy",
    label: "গোপনীয়তা নীতি",
    fields: [
      T("title", "শিরোনাম"),
      T("updated", "আপডেট তারিখ"),
      TA("intro", "ভূমিকা"),
      T("s1_title", "সেকশন ১ — শিরোনাম"),
      TA("s1_body", "সেকশন ১ — বডি"),
      T("s2_title", "সেকশন ২ — শিরোনাম"),
      TA("s2_body", "সেকশন ২ — বডি"),
      T("s3_title", "সেকশন ৩ — শিরোনাম"),
      TA("s3_body", "সেকশন ৩ — বডি"),
      T("s4_title", "সেকশন ৪ — শিরোনাম"),
      TA("s4_body", "সেকশন ৪ — বডি"),
      T("s5_title", "সেকশন ৫ — শিরোনাম"),
      TA("s5_body", "সেকশন ৫ — বডি"),
      T("s6_title", "সেকশন ৬ — শিরোনাম"),
      TA("s6_body", "সেকশন ৬ — বডি"),
    ],
  },
  {
    key: "terms",
    label: "শর্তাবলী",
    fields: [
      T("title", "শিরোনাম"),
      T("updated", "আপডেট তারিখ"),
      TA("intro", "ভূমিকা"),
      T("s1_title", "সেকশন ১ — শিরোনাম"),
      TA("s1_body", "সেকশন ১ — বডি"),
      T("s2_title", "সেকশন ২ — শিরোনাম"),
      TA("s2_body", "সেকশন ২ — বডি"),
      T("s3_title", "সেকশন ৩ — শিরোনাম"),
      TA("s3_body", "সেকশন ৩ — বডি"),
      T("s4_title", "সেকশন ৪ — শিরোনাম"),
      TA("s4_body", "সেকশন ৪ — বডি"),
      T("s5_title", "সেকশন ৫ — শিরোনাম"),
      TA("s5_body", "সেকশন ৫ — বডি"),
    ],
  },
];

export function getPageSchema(key: string): PageSchema | undefined {
  return SITE_CONTENT_SCHEMA.find((p) => p.key === key);
}

export function useSiteContent(key: string): Record<string, string> {
  const defaults = SITE_CONTENT_DEFAULTS[key] ?? {};
  const [data, setData] = useState<Record<string, string>>(defaults);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_content")
      .select("data")
      .eq("key", key)
      .maybeSingle()
      .then(({ data: row }) => {
        if (cancelled) return;
        const remote = (row?.data as Record<string, string> | null) ?? {};
        setData({ ...defaults, ...remote });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}

export async function saveSiteContent(key: string, data: Record<string, string>) {
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, data }, { onConflict: "key" });
  if (error) throw error;
}

export function useSignedImage(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    supabase.storage
      .from("course-thumbnails")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
}