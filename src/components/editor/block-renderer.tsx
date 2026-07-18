import { Link } from "@tanstack/react-router";
import { BookOpen, Award, Users, Sparkles, PlayCircle, CheckCircle2, Star, Heart, Target } from "lucide-react";
import type { Block, HeroProps, HeadingProps, RichTextProps, ImageProps, CtaProps, FeaturesProps, SpacerProps, FeatureItem } from "@/lib/page-blocks";
import { useSignedBlockImage } from "@/lib/page-blocks";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Award, Users, Sparkles, PlayCircle, CheckCircle2, Star, Heart, Target,
};

function sectionStyle(b: Block): React.CSSProperties {
  const s = b.style ?? {};
  return {
    backgroundColor: s.bg || undefined,
    color: s.fg || undefined,
    paddingTop: s.padY ?? undefined,
    paddingBottom: s.padY ?? undefined,
  };
}

function innerStyle(b: Block): React.CSSProperties {
  const s = b.style ?? {};
  const align = s.align ?? "left";
  return {
    maxWidth: s.maxWidth ? `${s.maxWidth}px` : undefined,
    margin: "0 auto",
    textAlign: align,
    paddingLeft: 16,
    paddingRight: 16,
  };
}

export function BlockRenderer({ blocks, onSelect, selectedId }: { blocks: Block[]; onSelect?: (id: string) => void; selectedId?: string | null }) {
  return (
    <>
      {blocks.map((b) => (
        <div
          key={b.id}
          onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(b.id); } : undefined}
          className={onSelect ? `relative cursor-pointer outline-2 outline-offset-[-2px] transition ${selectedId === b.id ? "outline outline-teal" : "hover:outline hover:outline-teal/40"}` : ""}
        >
          <RenderBlock block={b} />
        </div>
      ))}
    </>
  );
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "hero": return <HeroBlock block={block} />;
    case "heading": return <HeadingBlock block={block} />;
    case "richtext": return <RichTextBlock block={block} />;
    case "image": return <ImageBlock block={block} />;
    case "features": return <FeaturesBlock block={block} />;
    case "cta": return <CtaBlock block={block} />;
    case "spacer": return <SpacerBlock block={block} />;
    default: return null;
  }
}

function HeroBlock({ block }: { block: Block }) {
  const p = block.props as HeroProps;
  const img = useSignedBlockImage(p.image);
  return (
    <section className="relative overflow-hidden" style={sectionStyle(block)}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal/5 via-background to-green/10" />
      <div style={innerStyle(block)}>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            {p.badge ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 text-xs font-medium text-teal">
                <Sparkles className="h-3.5 w-3.5" /> {p.badge}
              </span>
            ) : null}
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {p.title}{" "}
              {p.titleHighlight ? (
                <span className="bg-gradient-to-r from-teal to-green bg-clip-text text-transparent">{p.titleHighlight}</span>
              ) : null}
            </h1>
            {p.subtitle ? <p className="mt-5 max-w-lg text-lg text-muted-foreground">{p.subtitle}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {p.ctaLabel ? (
                <Link to={p.ctaHref || "/"} className="inline-flex items-center gap-2 rounded-md bg-teal px-5 py-3 text-sm font-medium text-teal-foreground hover:bg-teal/90">
                  {p.ctaLabel}
                </Link>
              ) : null}
              {p.ctaSecondaryLabel ? (
                <Link to={p.ctaSecondaryHref || "/"} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-secondary">
                  {p.ctaSecondaryLabel}
                </Link>
              ) : null}
            </div>
          </div>
          <div>
            {img ? (
              <img src={img} alt={p.title || ""} className="w-full rounded-2xl border border-border object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-teal/20 to-green/30">
                <PlayCircle className="h-16 w-16 text-teal" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeadingBlock({ block }: { block: Block }) {
  const p = block.props as HeadingProps;
  const level = p.level ?? 2;
  const Tag = (`h${level}`) as "h1" | "h2" | "h3";
  return (
    <section style={sectionStyle(block)}>
      <div style={innerStyle(block)}>
        <Tag style={{ fontSize: p.size ? `${p.size}px` : undefined, fontWeight: p.weight ?? 700 }} className="tracking-tight">
          {p.text}
        </Tag>
      </div>
    </section>
  );
}

function RichTextBlock({ block }: { block: Block }) {
  const p = block.props as RichTextProps;
  return (
    <section style={sectionStyle(block)}>
      <div style={innerStyle(block)}>
        <div style={{ fontSize: p.size ? `${p.size}px` : undefined, lineHeight: 1.7 }} className="whitespace-pre-wrap text-muted-foreground">
          {p.html}
        </div>
      </div>
    </section>
  );
}

function ImageBlock({ block }: { block: Block }) {
  const p = block.props as ImageProps;
  const img = useSignedBlockImage(p.src);
  return (
    <section style={sectionStyle(block)}>
      <div style={innerStyle(block)}>
        {img ? (
          <img src={img} alt={p.alt || ""} style={{ borderRadius: p.radius ?? 12, maxHeight: p.maxHeight ?? undefined }} className="mx-auto w-full object-cover" />
        ) : (
          <div className="grid h-48 w-full place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            কোনো ইমেজ যোগ করা হয়নি
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturesBlock({ block }: { block: Block }) {
  const p = block.props as FeaturesProps;
  const items = (p.items ?? []) as FeatureItem[];
  return (
    <section style={sectionStyle(block)}>
      <div style={innerStyle(block)}>
        {p.title ? <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{p.title}</h2> : null}
        {p.subtitle ? <p className="mt-3 text-muted-foreground">{p.subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-3" style={{ textAlign: "left" }}>
          {items.map((it, i) => {
            const Icon = ICONS[it.icon || "BookOpen"] || BookOpen;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal/10 text-teal">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ block }: { block: Block }) {
  const p = block.props as CtaProps;
  return (
    <section style={sectionStyle(block)}>
      <div style={innerStyle(block)}>
        <div className="rounded-2xl bg-gradient-to-r from-teal to-green p-10 text-center text-white">
          {p.title ? <h2 className="text-3xl font-bold">{p.title}</h2> : null}
          {p.subtitle ? <p className="mt-3 opacity-90">{p.subtitle}</p> : null}
          {p.buttonLabel ? (
            <Link to={p.buttonHref || "/"} className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-teal hover:bg-white/90">
              <CheckCircle2 className="h-4 w-4" /> {p.buttonLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SpacerBlock({ block }: { block: Block }) {
  const p = block.props as SpacerProps;
  return <div style={{ height: p.height ?? 48 }} />;
}