import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "শর্তাবলী — আমিনশিপ একাডেমি" },
      { name: "description", content: "আমিনশিপ একাডেমির ব্যবহারের শর্তাবলী।" },
      { property: "og:title", content: "শর্তাবলী" },
      { property: "og:description", content: "প্ল্যাটফর্ম ব্যবহারের নিয়মাবলী।" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">শর্তাবলী</h1>
        <p className="mt-2 text-sm text-muted-foreground">সর্বশেষ আপডেট: ২০২৬</p>
        <Section title="গ্রহণযোগ্যতা">
          আমিনশিপ একাডেমি ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলী মেনে নিতে সম্মত হচ্ছেন।
        </Section>
        <Section title="অ্যাকাউন্ট">
          অ্যাকাউন্টের তথ্যের নির্ভুলতা এবং পাসওয়ার্ডের গোপনীয়তা আপনার দায়িত্ব।
        </Section>
        <Section title="কনটেন্টের ব্যবহার">
          কোর্স কনটেন্ট ব্যক্তিগত শিক্ষার জন্য প্রদত্ত। অনুমতি ছাড়া পুনঃবিতরণ বা বাণিজ্যিক ব্যবহার নিষিদ্ধ।
        </Section>
        <Section title="পেমেন্ট ও রিফান্ড">
          ভবিষ্যতে পেইড কোর্সের ক্ষেত্রে প্রকাশিত রিফান্ড নীতি প্রযোজ্য হবে।
        </Section>
        <Section title="সেবার পরিবর্তন">
          আমরা যেকোনো সময় সেবা পরিবর্তন, স্থগিত বা বন্ধ করার অধিকার সংরক্ষণ করি।
        </Section>
        <Section title="দায়সীমা">
          আইন অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত পরোক্ষ ক্ষতির জন্য আমরা দায়ী নই।
        </Section>
        <Section title="যোগাযোগ">
          শর্তাবলী সম্পর্কে প্রশ্নের জন্য info@aminship.academy ঠিকানায় লিখুন।
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