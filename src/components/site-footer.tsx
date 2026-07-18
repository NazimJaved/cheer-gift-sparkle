import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal text-teal-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">আমিনশিপ একাডেমি</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            বাংলাদেশি শিক্ষার্থীদের জন্য বাংলা ভাষার আধুনিক অনলাইন কোর্স প্ল্যাটফর্ম।
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">লিঙ্কসমূহ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-foreground">কোর্সসমূহ</Link></li>
            <li><Link to="/about" className="hover:text-foreground">আমাদের সম্পর্কে</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">যোগাযোগ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">আইনি</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">গোপনীয়তা নীতি</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">শর্তাবলী</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} আমিনশিপ একাডেমি। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>
    </footer>
  );
}