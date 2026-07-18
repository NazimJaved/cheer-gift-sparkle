import { useState } from "react";
import { Loader2, Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Block, FeatureItem } from "@/lib/page-blocks";
import { uploadBlockImage } from "@/lib/page-blocks";

type Props = {
  block: Block;
  onChange: (next: Block) => void;
};

const inputCls = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal";

export function Inspector({ block, onChange }: Props) {
  const [tab, setTab] = useState<"content" | "style">("content");

  function setProp(key: string, value: unknown) {
    onChange({ ...block, props: { ...block.props, [key]: value } });
  }
  function setStyle(key: string, value: unknown) {
    onChange({ ...block, style: { ...(block.style ?? {}), [key]: value } });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border">
        <div className="flex gap-1 px-3 pt-3">
          <TabBtn active={tab === "content"} onClick={() => setTab("content")}>কনটেন্ট</TabBtn>
          <TabBtn active={tab === "style"} onClick={() => setTab("style")}>স্টাইল</TabBtn>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "content" ? <ContentFields block={block} setProp={setProp} /> : <StyleFields block={block} setStyle={setStyle} />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-teal text-teal" : "border-transparent text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ContentFields({ block, setProp }: { block: Block; setProp: (k: string, v: unknown) => void }) {
  const p = block.props as Record<string, unknown>;
  switch (block.type) {
    case "hero":
      return (
        <>
          <Field label="ব্যাজ"><input className={inputCls} value={(p.badge as string) ?? ""} onChange={(e) => setProp("badge", e.target.value)} /></Field>
          <Field label="শিরোনাম (মূল)"><input className={inputCls} value={(p.title as string) ?? ""} onChange={(e) => setProp("title", e.target.value)} /></Field>
          <Field label="শিরোনাম (হাইলাইট)"><input className={inputCls} value={(p.titleHighlight as string) ?? ""} onChange={(e) => setProp("titleHighlight", e.target.value)} /></Field>
          <Field label="সাবটাইটেল"><textarea className={inputCls} rows={3} value={(p.subtitle as string) ?? ""} onChange={(e) => setProp("subtitle", e.target.value)} /></Field>
          <Field label="প্রাইমারি বাটন লেবেল"><input className={inputCls} value={(p.ctaLabel as string) ?? ""} onChange={(e) => setProp("ctaLabel", e.target.value)} /></Field>
          <Field label="প্রাইমারি বাটন লিঙ্ক"><input className={inputCls} value={(p.ctaHref as string) ?? ""} onChange={(e) => setProp("ctaHref", e.target.value)} /></Field>
          <Field label="সেকেন্ডারি বাটন লেবেল"><input className={inputCls} value={(p.ctaSecondaryLabel as string) ?? ""} onChange={(e) => setProp("ctaSecondaryLabel", e.target.value)} /></Field>
          <Field label="সেকেন্ডারি বাটন লিঙ্ক"><input className={inputCls} value={(p.ctaSecondaryHref as string) ?? ""} onChange={(e) => setProp("ctaSecondaryHref", e.target.value)} /></Field>
          <ImageField label="হিরো ইমেজ" value={p.image as string} onChange={(v) => setProp("image", v)} />
        </>
      );
    case "heading":
      return (
        <>
          <Field label="টেক্সট"><input className={inputCls} value={(p.text as string) ?? ""} onChange={(e) => setProp("text", e.target.value)} /></Field>
          <Field label="লেভেল">
            <select className={inputCls} value={(p.level as number) ?? 2} onChange={(e) => setProp("level", Number(e.target.value))}>
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </Field>
          <Field label={`ফন্ট সাইজ (${(p.size as number) ?? 32}px)`}>
            <input type="range" min={16} max={72} value={(p.size as number) ?? 32} onChange={(e) => setProp("size", Number(e.target.value))} className="w-full" />
          </Field>
          <Field label={`ওজন (${(p.weight as number) ?? 700})`}>
            <input type="range" min={300} max={900} step={100} value={(p.weight as number) ?? 700} onChange={(e) => setProp("weight", Number(e.target.value))} className="w-full" />
          </Field>
        </>
      );
    case "richtext":
      return (
        <>
          <Field label="টেক্সট"><textarea className={inputCls} rows={8} value={(p.html as string) ?? ""} onChange={(e) => setProp("html", e.target.value)} /></Field>
          <Field label={`ফন্ট সাইজ (${(p.size as number) ?? 16}px)`}>
            <input type="range" min={12} max={28} value={(p.size as number) ?? 16} onChange={(e) => setProp("size", Number(e.target.value))} className="w-full" />
          </Field>
        </>
      );
    case "image":
      return (
        <>
          <ImageField label="ইমেজ" value={p.src as string} onChange={(v) => setProp("src", v)} />
          <Field label="Alt টেক্সট"><input className={inputCls} value={(p.alt as string) ?? ""} onChange={(e) => setProp("alt", e.target.value)} /></Field>
          <Field label={`রেডিয়াস (${(p.radius as number) ?? 12}px)`}>
            <input type="range" min={0} max={48} value={(p.radius as number) ?? 12} onChange={(e) => setProp("radius", Number(e.target.value))} className="w-full" />
          </Field>
          <Field label={`সর্বোচ্চ উচ্চতা (${(p.maxHeight as number) ?? 480}px)`}>
            <input type="range" min={120} max={800} value={(p.maxHeight as number) ?? 480} onChange={(e) => setProp("maxHeight", Number(e.target.value))} className="w-full" />
          </Field>
        </>
      );
    case "cta":
      return (
        <>
          <Field label="শিরোনাম"><input className={inputCls} value={(p.title as string) ?? ""} onChange={(e) => setProp("title", e.target.value)} /></Field>
          <Field label="সাবটাইটেল"><textarea className={inputCls} rows={2} value={(p.subtitle as string) ?? ""} onChange={(e) => setProp("subtitle", e.target.value)} /></Field>
          <Field label="বাটন লেবেল"><input className={inputCls} value={(p.buttonLabel as string) ?? ""} onChange={(e) => setProp("buttonLabel", e.target.value)} /></Field>
          <Field label="বাটন লিঙ্ক"><input className={inputCls} value={(p.buttonHref as string) ?? ""} onChange={(e) => setProp("buttonHref", e.target.value)} /></Field>
        </>
      );
    case "features":
      return <FeaturesFields p={p} setProp={setProp} />;
    case "spacer":
      return (
        <Field label={`উচ্চতা (${(p.height as number) ?? 48}px)`}>
          <input type="range" min={8} max={200} value={(p.height as number) ?? 48} onChange={(e) => setProp("height", Number(e.target.value))} className="w-full" />
        </Field>
      );
  }
}

function FeaturesFields({ p, setProp }: { p: Record<string, unknown>; setProp: (k: string, v: unknown) => void }) {
  const items = ((p.items as FeatureItem[]) ?? []).slice();
  function setItem(i: number, next: FeatureItem) {
    const arr = items.slice();
    arr[i] = next;
    setProp("items", arr);
  }
  function addItem() { setProp("items", [...items, { icon: "Star", title: "নতুন ফিচার", desc: "" }]); }
  function removeItem(i: number) { setProp("items", items.filter((_, idx) => idx !== i)); }
  return (
    <>
      <Field label="শিরোনাম"><input className={inputCls} value={(p.title as string) ?? ""} onChange={(e) => setProp("title", e.target.value)} /></Field>
      <Field label="সাবটাইটেল"><input className={inputCls} value={(p.subtitle as string) ?? ""} onChange={(e) => setProp("subtitle", e.target.value)} /></Field>
      <div className="mt-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">আইটেম</span>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs hover:bg-secondary">
            <Plus className="h-3 w-3" /> যোগ
          </button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="mb-3 rounded-md border border-border p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">#{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
            <input className={inputCls + " mb-1"} placeholder="আইকন (BookOpen, Award, Users, Star, Heart, Target, Sparkles, CheckCircle2, PlayCircle)" value={it.icon ?? ""} onChange={(e) => setItem(i, { ...it, icon: e.target.value })} />
            <input className={inputCls + " mb-1"} placeholder="শিরোনাম" value={it.title ?? ""} onChange={(e) => setItem(i, { ...it, title: e.target.value })} />
            <textarea className={inputCls} rows={2} placeholder="বিবরণ" value={it.desc ?? ""} onChange={(e) => setItem(i, { ...it, desc: e.target.value })} />
          </div>
        ))}
      </div>
    </>
  );
}

function StyleFields({ block, setStyle }: { block: Block; setStyle: (k: string, v: unknown) => void }) {
  const s = block.style ?? {};
  return (
    <>
      <Field label="ব্যাকগ্রাউন্ড কালার">
        <div className="flex gap-2">
          <input type="color" value={s.bg || "#ffffff"} onChange={(e) => setStyle("bg", e.target.value)} className="h-9 w-14 rounded border border-input" />
          <input className={inputCls} value={s.bg ?? ""} placeholder="যেমন #ffffff বা transparent" onChange={(e) => setStyle("bg", e.target.value)} />
          <button type="button" className="rounded border border-input px-2 text-xs" onClick={() => setStyle("bg", undefined)}>রিসেট</button>
        </div>
      </Field>
      <Field label="টেক্সট কালার">
        <div className="flex gap-2">
          <input type="color" value={s.fg || "#000000"} onChange={(e) => setStyle("fg", e.target.value)} className="h-9 w-14 rounded border border-input" />
          <input className={inputCls} value={s.fg ?? ""} onChange={(e) => setStyle("fg", e.target.value)} />
          <button type="button" className="rounded border border-input px-2 text-xs" onClick={() => setStyle("fg", undefined)}>রিসেট</button>
        </div>
      </Field>
      <Field label={`উপর-নিচ প্যাডিং (${s.padY ?? 0}px)`}>
        <input type="range" min={0} max={200} value={s.padY ?? 0} onChange={(e) => setStyle("padY", Number(e.target.value))} className="w-full" />
      </Field>
      <Field label="অ্যালাইনমেন্ট">
        <select className={inputCls} value={s.align ?? "left"} onChange={(e) => setStyle("align", e.target.value)}>
          <option value="left">বাম</option>
          <option value="center">মাঝ</option>
          <option value="right">ডান</option>
        </select>
      </Field>
      <Field label={`সর্বোচ্চ প্রস্থ (${s.maxWidth ?? 1200}px)`}>
        <input type="range" min={480} max={1600} step={40} value={s.maxWidth ?? 1200} onChange={(e) => setStyle("maxWidth", Number(e.target.value))} className="w-full" />
      </Field>
    </>
  );
}

function ImageField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  async function handle(file: File) {
    setUploading(true);
    try {
      const path = await uploadBlockImage(file);
      onChange(path);
      toast.success("ইমেজ আপলোড হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
    }
  }
  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          PC থেকে আপলোড
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
        </label>
        {value ? (
          <div className="flex items-center justify-between rounded border border-border px-2 py-1 text-xs text-muted-foreground">
            <span className="truncate">{value}</span>
            <button type="button" onClick={() => onChange("")} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ) : null}
      </div>
    </Field>
  );
}