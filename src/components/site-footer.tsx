import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useSiteContent, useSignedImage } from "@/lib/site-content";

export function SiteFooter() {
  const c = useSiteContent("footer");
  const logoUrl = useSignedImage(c.logo_image);
  const copyright = (c.copyright ?? "").replace("{year}", String(new Date().getFullYear()));
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={c.brand_name} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal text-teal-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
            )}
            <span className="text-lg font-semibold">{c.brand_name}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{c.description}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{c.links_heading}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-foreground">{c.link_1_label}</Link></li>
            <li><Link to="/about" className="hover:text-foreground">{c.link_2_label}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{c.link_3_label}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{c.legal_heading}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">{c.legal_1_label}</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">{c.legal_2_label}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
          {copyright}
        </p>
      </div>
    </footer>
  );
}