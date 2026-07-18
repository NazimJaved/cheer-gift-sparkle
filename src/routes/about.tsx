import { createFileRoute } from "@tanstack/react-router";
import { Target, Heart, Users } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির লক্ষ্য, দৃষ্টিভঙ্গি এবং গল্প।" },
      { property: "og:title", content: "আমাদের সম্পর্কে — আমিনশিপ একাডেমি" },
      { property: "og:description", content: "বাংলাদেশি শিক্ষার্থীদের জন্য বাংলা ভাষার অনলাইন লার্নিং প্ল্যাটফর্ম।" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">আমাদের সম্পর্কে</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          আমিনশিপ একাডেমি বাংলাদেশি শিক্ষার্থীদের জন্য একটি আধুনিক অনলাইন শিক্ষা প্ল্যাটফর্ম। আমরা বিশ্বাস করি, মাতৃভাষায় শেখার সুযোগ পেলে প্রতিটি শিক্ষার্থী তার সর্বোচ্চ সম্ভাবনায় পৌঁছাতে পারে।
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card icon={<Target className="h-6 w-6" />} title="আমাদের লক্ষ্য" desc="মানসম্মত, প্রাসঙ্গিক এবং সাশ্রয়ী অনলাইন কোর্স প্রদান করা।" />
          <Card icon={<Heart className="h-6 w-6" />} title="আমাদের মূল্যবোধ" desc="স্বচ্ছতা, শিক্ষার্থী-কেন্দ্রিকতা এবং ধারাবাহিক মান।" />
          <Card icon={<Users className="h-6 w-6" />} title="আমাদের কমিউনিটি" desc="সারাদেশের হাজারো শিক্ষার্থী ও শিক্ষকের সক্রিয় নেটওয়ার্ক।" />
        </div>
        <div className="mt-12 rounded-xl border border-border bg-card p-8">
          <h2 className="text-2xl font-bold">আমাদের গল্প</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            ভূমি জরিপ ও ডিজিটাল আমিনশিপের মতো গুরুত্বপূর্ণ পেশাগত দক্ষতা বাংলা ভাষায় শেখার মানসম্মত রিসোর্সের অভাব দেখে আমরা এই একাডেমি প্রতিষ্ঠা করি। আমাদের লক্ষ্য প্রতিটি বাংলাদেশি যেন নিজের ভাষায়, নিজের গতিতে, পেশাদার দক্ষতা অর্জন করতে পারেন।
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

function Card({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal/10 text-teal">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}