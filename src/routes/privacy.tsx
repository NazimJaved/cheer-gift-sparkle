import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "গোপনীয়তা নীতি — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির গোপনীয়তা নীতি।" },
      { property: "og:title", content: "গোপনীয়তা নীতি" },
      { property: "og:description", content: "আপনার তথ্য কীভাবে সংগৃহীত ও ব্যবহৃত হয়।" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">গোপনীয়তা নীতি</h1>
        <p className="mt-2 text-sm text-muted-foreground">সর্বশেষ আপডেট: ২০২৬</p>
        <p className="mt-6 text-sm text-muted-foreground">এই পৃষ্ঠাটি আমিনশিপ একাডেমি কর্তৃক পরিচালিত। এখানে বর্ণিত তথ্যগুলি আমাদের প্ল্যাটফর্মে আপনার তথ্য কীভাবে পরিচালিত হয় তা ব্যাখ্যা করে।</p>
        <Section title="আমরা কী তথ্য সংগ্রহ করি">
          অ্যাকাউন্ট তৈরি ও কোর্স অ্যাক্সেসের জন্য প্রয়োজনীয় তথ্য যেমন নাম, ইমেইল ও প্রোফাইল তথ্য।
        </Section>
        <Section title="তথ্যের ব্যবহার">
          আপনার শেখার অভিজ্ঞতা উন্নত করা, অ্যাক্সেস প্রদান এবং গুরুত্বপূর্ণ ঘোষণা পাঠানোর জন্য।
        </Section>
        <Section title="তথ্যের সুরক্ষা">
          আমরা যুক্তিসঙ্গত প্রশাসনিক ও প্রযুক্তিগত ব্যবস্থার মাধ্যমে আপনার তথ্য সুরক্ষিত রাখি।
        </Section>
        <Section title="তৃতীয় পক্ষ">
          প্রয়োজনীয় সেবা প্রদানকারীদের (যেমন হোস্টিং ও ইমেইল) সাথে সীমিত তথ্য শেয়ার করা হতে পারে।
        </Section>
        <Section title="আপনার অধিকার">
          আপনি যেকোনো সময় আপনার তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার অনুরোধ করতে পারেন।
        </Section>
        <Section title="যোগাযোগ">
          এই নীতি সম্পর্কে কোনো প্রশ্ন থাকলে info@aminship.academy ঠিকানায় যোগাযোগ করুন।
        </Section>
      </article>
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}