export type Course = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  duration: string;
  lessons: number;
  language: string;
  price: string;
  instructor: string;
  highlights: string[];
  curriculum: { module: string; lessons: string[] }[];
  outcomes: string[];
  audience: string[];
};

export const courses: Course[] = [
  {
    slug: "digital-aminship",
    title: "ডিজিটাল আমিনশিপ",
    subtitle: "আধুনিক ভূমি জরিপ ও ডিজিটাল আমিন হওয়ার সম্পূর্ণ গাইড",
    description:
      "এই কোর্সে আপনি শিখবেন ভূমি জরিপের মৌলিক ধারণা, ডিজিটাল টুলস ব্যবহার, দাগ-খতিয়ান বিশ্লেষণ, ম্যাপ রিডিং এবং একজন পেশাদার ডিজিটাল আমিন হিসেবে ক্যারিয়ার গড়ার সমস্ত দক্ষতা।",
    level: "শুরু থেকে অ্যাডভান্সড",
    duration: "১২ সপ্তাহ",
    lessons: 48,
    language: "বাংলা",
    price: "শীঘ্রই আসছে",
    instructor: "প্রফেশনাল আমিন প্যানেল",
    highlights: [
      "৪৮টি ভিডিও লেসন",
      "প্র্যাকটিক্যাল ফিল্ড ওয়ার্ক",
      "সার্টিফিকেট প্রদান",
      "লাইফটাইম অ্যাক্সেস",
    ],
    curriculum: [
      {
        module: "মডিউল ১ — ভূমি জরিপের মৌলিক ধারণা",
        lessons: ["জরিপের ইতিহাস", "একক ও পরিমাপ", "মৌজা ম্যাপ পরিচিতি", "দাগ ও খতিয়ান"],
      },
      {
        module: "মডিউল ২ — ডিজিটাল টুলস",
        lessons: ["GPS ব্যবহার", "মোবাইল অ্যাপ", "ডিজিটাল ম্যাপিং", "ডেটা এন্ট্রি"],
      },
      {
        module: "মডিউল ৩ — ফিল্ড ওয়ার্ক",
        lessons: ["জমি পরিমাপ", "সীমানা নির্ধারণ", "স্কেচ তৈরি", "রিপোর্টিং"],
      },
      {
        module: "মডিউল ৪ — ক্যারিয়ার ও প্রফেশনাল স্কিল",
        lessons: ["ক্লায়েন্ট হ্যান্ডলিং", "মূল্য নির্ধারণ", "আইনি দিক", "ব্যবসায়িক পরিকল্পনা"],
      },
    ],
    outcomes: [
      "স্বাধীনভাবে ভূমি জরিপ করতে পারবেন",
      "ডিজিটাল ম্যাপিং টুলস ব্যবহারে দক্ষ হবেন",
      "একজন পেশাদার আমিন হিসেবে কাজ শুরু করতে পারবেন",
    ],
    audience: [
      "নতুন যারা আমিন পেশায় আসতে চান",
      "কর্মরত আমিন যারা ডিজিটাল দক্ষতা বাড়াতে চান",
      "ভূমি সংক্রান্ত কাজে আগ্রহী শিক্ষার্থী",
    ],
  },
];

export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug);
}