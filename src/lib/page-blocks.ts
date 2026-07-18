import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ---------- Types ----------

export type BlockType =
  | "hero"
  | "heading"
  | "richtext"
  | "image"
  | "cta"
  | "features"
  | "spacer";

export interface BlockStyle {
  bg?: string;
  fg?: string;
  padY?: number; // px vertical padding
  align?: "left" | "center" | "right";
  maxWidth?: number; // px
}

export interface HeroProps {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  image?: string; // storage path in course-thumbnails/site
}

export interface HeadingProps {
  text?: string;
  level?: 1 | 2 | 3;
  size?: number; // px
  weight?: number;
}

export interface RichTextProps {
  html?: string;
  size?: number;
}

export interface ImageProps {
  src?: string; // storage path
  alt?: string;
  radius?: number;
  maxHeight?: number;
}

export interface CtaProps {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export interface FeatureItem {
  icon?: string; // lucide name
  title?: string;
  desc?: string;
}

export interface FeaturesProps {
  title?: string;
  subtitle?: string;
  items?: FeatureItem[];
}

export interface SpacerProps {
  height?: number;
}

export type BlockProps =
  | HeroProps
  | HeadingProps
  | RichTextProps
  | ImageProps
  | CtaProps
  | FeaturesProps
  | SpacerProps;

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  style?: BlockStyle;
}

export interface PageBlocks {
  blocks: Block[];
}

// ---------- Catalog ----------

export const BLOCK_CATALOG: { type: BlockType; label: string; description: string }[] = [
  { type: "hero", label: "হিরো সেকশন", description: "ব্যাজ, শিরোনাম, সাবটাইটেল, বাটন, ইমেজ" },
  { type: "heading", label: "শিরোনাম", description: "H1/H2/H3 হেডিং" },
  { type: "richtext", label: "প্যারাগ্রাফ / টেক্সট", description: "একাধিক লাইনের টেক্সট" },
  { type: "image", label: "ইমেজ", description: "একক ইমেজ" },
  { type: "features", label: "ফিচার গ্রিড", description: "৩টি কার্ড সহ ফিচার সেকশন" },
  { type: "cta", label: "CTA ব্যানার", description: "কল টু অ্যাকশন সেকশন" },
  { type: "spacer", label: "স্পেসার", description: "খালি জায়গা" },
];

export function defaultBlock(type: BlockType): Block {
  const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
  switch (type) {
    case "hero":
      return {
        id,
        type,
        props: {
          badge: "নতুন কোর্স উন্মোচিত",
          title: "বাংলায় শিখুন,",
          titleHighlight: "ডিজিটাল দক্ষতায়",
          subtitle: "বাংলাদেশি শিক্ষার্থীদের জন্য পেশাদার অনলাইন কোর্স।",
          ctaLabel: "কোর্স দেখুন",
          ctaHref: "/courses",
          ctaSecondaryLabel: "আরও জানুন",
          ctaSecondaryHref: "/about",
        },
        style: { padY: 96, align: "left", maxWidth: 1200 },
      };
    case "heading":
      return { id, type, props: { text: "নতুন শিরোনাম", level: 2, size: 32, weight: 700 }, style: { padY: 24, align: "left", maxWidth: 1200 } };
    case "richtext":
      return { id, type, props: { html: "এখানে আপনার টেক্সট লিখুন।", size: 16 }, style: { padY: 16, align: "left", maxWidth: 800 } };
    case "image":
      return { id, type, props: { src: "", alt: "", radius: 12, maxHeight: 480 }, style: { padY: 32, align: "center", maxWidth: 1200 } };
    case "features":
      return {
        id,
        type,
        props: {
          title: "কেন আমাদের বেছে নেবেন?",
          subtitle: "আধুনিক পদ্ধতিতে শেখা।",
          items: [
            { icon: "BookOpen", title: "বাংলায় কনটেন্ট", desc: "সব লেসন বাংলা ভাষায়।" },
            { icon: "Award", title: "সার্টিফিকেট", desc: "কোর্স শেষে সার্টিফিকেট।" },
            { icon: "Users", title: "বিশেষজ্ঞ শিক্ষক", desc: "ইন্ডাস্ট্রি বিশেষজ্ঞ।" },
          ],
        },
        style: { padY: 64, align: "center", maxWidth: 1200 },
      };
    case "cta":
      return {
        id,
        type,
        props: { title: "আজই শেখা শুরু করুন", subtitle: "নতুন দক্ষতা অর্জন করুন।", buttonLabel: "কোর্স দেখুন", buttonHref: "/courses" },
        style: { padY: 64, align: "center", maxWidth: 1200 },
      };
    case "spacer":
      return { id, type, props: { height: 48 }, style: {} };
  }
}

// ---------- Loader ----------

export function usePageBlocks(page: string) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("site_content").select("blocks").eq("key", page).maybeSingle();
      if (!alive) return;
      const b = (data?.blocks as unknown as PageBlocks | null)?.blocks;
      setBlocks(Array.isArray(b) && b.length > 0 ? b : null);
    })();
    return () => {
      alive = false;
    };
  }, [page]);
  return blocks;
}

export async function loadDraft(page: string): Promise<Block[] | null> {
  const { data } = await supabase.from("site_content").select("draft, blocks").eq("key", page).maybeSingle();
  const draft = (data?.draft as unknown as PageBlocks | null)?.blocks;
  if (Array.isArray(draft)) return draft;
  const pub = (data?.blocks as unknown as PageBlocks | null)?.blocks;
  return Array.isArray(pub) ? pub : null;
}

export async function saveDraft(page: string, blocks: Block[]) {
  const payload: PageBlocks = { blocks };
  return supabase
    .from("site_content")
    .upsert({ key: page, draft: payload as unknown as never, data: {} as never }, { onConflict: "key" });
}

export async function publishBlocks(page: string, blocks: Block[]) {
  const payload: PageBlocks = { blocks };
  return supabase
    .from("site_content")
    .upsert(
      { key: page, blocks: payload as unknown as never, draft: null as unknown as never, data: {} as never },
      { onConflict: "key" },
    );
}

// ---------- Storage image helper ----------

export function useSignedBlockImage(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("course-thumbnails")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}

export async function uploadBlockImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `site/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("course-thumbnails")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export const EDITABLE_PAGES: { key: string; label: string; path: string }[] = [
  { key: "home", label: "হোম", path: "/" },
  { key: "about", label: "আমাদের সম্পর্কে", path: "/about" },
  { key: "contact", label: "যোগাযোগ", path: "/contact" },
  { key: "privacy", label: "গোপনীয়তা নীতি", path: "/privacy" },
  { key: "terms", label: "শর্তাবলী", path: "/terms" },
  { key: "courses_intro", label: "কোর্স পেজ (হেডার)", path: "/courses" },
];