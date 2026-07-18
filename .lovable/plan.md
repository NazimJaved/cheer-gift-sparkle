## Goal

অ্যাডমিন `/admin/edit/:page` তে গিয়ে যেকোনো পাবলিক পেজের **প্রতিটি এলিমেন্ট** (টেক্সট, ইমেজ, কালার, ফন্ট সাইজ, স্পেসিং, সেকশন অর্ডার, সেকশন যোগ/মুছে দেওয়া) সরাসরি লাইভ প্রিভিউতে এডিট করবে ও সংরক্ষণ করবে। ভিজিটররা আপডেটেড ভার্সন দেখবে।

## Architecture

```text
/admin/edit/:page
├── Left sidebar: page tree + section list (add / delete / reorder)
├── Center: <iframe src="/{page}?edit=1"> live preview
└── Right sidebar: property inspector for selected element
     ├─ Text tab: content, font size, weight, alignment, color
     ├─ Style tab: bg color, padding, margin, radius, shadow
     └─ Media tab: image upload from PC / URL
```

- Selected element highlighted with outline; click any element inside the iframe to inspect.
- Save → writes to Supabase; iframe hot-reloads content from DB.

## Data model (extends existing `site_content`)

বর্তমান `site_content` টেবিলে JSONB `content` কলাম আছে — সেটিকেই স্কিমা-ড্রিভেন থেকে **ফ্রি-ফর্ম block tree** এ আপগ্রেড করব:

```json
{
  "blocks": [
    { "id": "hero-1", "type": "hero", "props": { "title": "...", "bg": "#..." } },
    { "id": "features-1", "type": "features-grid", "props": { "items": [...] } },
    { "id": "cta-1", "type": "cta", "props": {...} }
  ],
  "theme": { "primary": "#0d9488", "font_body": "Hind Siliguri" }
}
```

- Backward compatible: পুরাতন schema-based পেজ (home/about/contact/privacy/terms/branding/footer) একটি `legacy` block হিসেবে রেন্ডার হবে; অ্যাডমিন চাইলে "Convert to blocks" চেপে block tree তে রূপান্তর করবে।

## Block library (initial set)

Hero, Heading, Rich text, Image, Two-column, Features grid, Testimonials, CTA banner, Course-list embed, Spacer, Divider, HTML embed. প্রতিটি block-এর একটি Renderer কম্পোনেন্ট + Inspector schema থাকবে।

## Editor UX

- **Element selection**: iframe এ postMessage bridge — hover → highlight, click → sends `{blockId, path}` to parent editor.
- **Inline text edit**: text nodes contenteditable হয়ে সরাসরি টাইপ করা যাবে; blur → save.
- **Image upload**: existing `course-thumbnails` bucket-এ `site/` folder-এ আপলোড।
- **Add section**: sidebar "+" → block picker → inserts at cursor.
- **Reorder**: drag handle on each section (dnd-kit — already installed)।
- **Delete**: trash icon with confirm।
- **Undo/Redo**: local history stack (session only, up to 50 steps)।
- **Publish**: Draft vs Published — draft in `site_content.draft` JSONB, live in `content`. "Publish" button copies draft → content।

## Pages covered

সব পাবলিক রুট: `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/courses`, `/courses/:slug`. Header/Footer branding আলাদা global block হিসেবে সব পেজে shared।

Course listing (`/courses`) ও details (`/courses/:slug`) পেজে course data ডাইনামিক থাকবে — অ্যাডমিন শুধু surrounding blocks (heading, intro, CTA) এডিট করতে পারবে; কোর্স কার্ডের styling wrapper block দিয়ে হবে।

## Security

- `/admin/edit/*` `_authenticated` + admin role check (existing pattern)।
- `site_content` RLS: read public, write admin — already correct।
- Storage RLS: admin write, public read — already correct।

## Files to create/edit

New:
- `src/routes/_authenticated/admin.edit.$page.tsx` — editor shell (sidebar + iframe + inspector)
- `src/components/editor/block-renderer.tsx` — renders block tree
- `src/components/editor/blocks/*.tsx` — each block type
- `src/components/editor/inspector.tsx` — right-panel property editor
- `src/components/editor/block-picker.tsx` — add-block modal
- `src/lib/page-blocks.ts` — block schemas, defaults, types
- `src/lib/editor-bridge.ts` — parent↔iframe postMessage helpers
- Supabase migration: add `draft JSONB`, `blocks JSONB` columns to `site_content`

Edit:
- `src/routes/index.tsx`, `about.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx`, `courses.tsx` — render block tree if present, else fallback to current CMS/legacy render; detect `?edit=1` search param and enable edit overlay
- `src/components/site-header.tsx`, `site-footer.tsx` — support block-based branding
- `src/routes/_authenticated/admin.index.tsx` — add "Visual Editor" nav
- `src/routes/_authenticated/admin.tsx` — sidebar link

## Phased delivery

Given scope, I'll build in one pass but scope the first version as:

**v1 (this turn)**: Editor shell, iframe live preview, block tree data model, migration, 6 core blocks (hero, heading, rich-text, image, two-col, CTA), inspector with text/style/media tabs, add/delete/reorder, image upload, save + publish, applied to Home page as pilot.

**v2 (follow-up)**: Extend to About/Contact/Privacy/Terms; add Features/Testimonials/Course-list blocks; header/footer visual editing; undo/redo history.

I'll deliver v1 first, then you can test on Home and I'll roll it out to the rest.

## Notes

- বড় ফিচার — v1-ই ~10-12 files। Home পেজে টেস্ট করে confirm করলে বাকি পেজে expand করব।
- Existing CMS editor (`/admin/content/*`) কাজ করতে থাকবে; visual editor আলাদা entry।
- এটি টেমপ্লেট-ভিত্তিক block system, Webflow/Framer এর মত ফ্রি canvas নয় — mobile responsiveness ও ডিজাইন consistency ধরে রাখতে।
