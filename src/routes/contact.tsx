import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent } from "@/lib/site-content";
import { usePageBlocks } from "@/lib/page-blocks";
import { BlockRenderer } from "@/components/editor/block-renderer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির সাথে যোগাযোগ করুন।" },
      { property: "og:title", content: "যোগাযোগ — আমিনশিপ একাডেমি" },
      { property: "og:description", content: "আপনার প্রশ্ন বা মতামত আমাদের জানান।" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const blocks = usePageBlocks("contact");
  if (blocks && blocks.length > 0) {
    return (
      <SiteLayout>
        <BlockRenderer blocks={blocks} />
      </SiteLayout>
    );
  }
  const c = useSiteContent("contact");
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.subtitle}</p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-1">
            <Info icon={<Mail className="h-5 w-5" />} title="ইমেইল" value={c.email} />
            <Info icon={<Phone className="h-5 w-5" />} title="ফোন" value={c.phone} />
            <Info icon={<MapPin className="h-5 w-5" />} title="ঠিকানা" value={c.address} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-xl border border-border bg-card p-6 md:col-span-2"
          >
            {sent ? (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green/10 text-green"><Send className="h-6 w-6" /></div>
                <h3 className="mt-4 text-lg font-semibold">ধন্যবাদ!</h3>
                <p className="mt-1 text-sm text-muted-foreground">আপনার বার্তা পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Field label="নাম" name="name" required />
                <Field label="ইমেইল" name="email" type="email" required />
                <div>
                  <label className="mb-1 block text-sm font-medium">বার্তা</label>
                  <textarea required rows={5} maxLength={1000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal" />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-teal-foreground hover:bg-teal/90">
                  <Send className="h-4 w-4" /> পাঠান
                </button>
              </div>
            )}
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

function Info({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-teal/10 text-teal">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input name={name} type={type} required={required} maxLength={200} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal" />
    </div>
  );
}