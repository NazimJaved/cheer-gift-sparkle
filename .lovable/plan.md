# Secure LMS Refactor Plan

Goal: harden the app into a production-ready LMS with three roles (super_admin, admin, student), enforced end-to-end via Supabase RLS + route guards + UI, without breaking existing features.

## 1. Roles & Database (Supabase migration)

Extend `app_role` enum to add `super_admin` (keep existing `admin`, `student`, `moderator`).

Update `has_role()` semantics with a helper:
- `is_admin(uid)` → true if `admin` OR `super_admin`
- `is_super_admin(uid)` → true only if `super_admin`

Rewrite RLS policies:

| Table | Student | Admin | Super Admin |
|---|---|---|---|
| profiles | read/update own | read all | full |
| user_roles | read own | read all | full (only super_admin can insert/update/delete roles) |
| courses | read published | full CRUD | full CRUD |
| lessons | read published + enrolled (or free preview) | full CRUD | full CRUD |
| enrollments | read own | read all, insert | full |
| payments | read/insert own | read all, approve/reject | full |
| lesson_progress | read/write own | read all | full |
| reviews | read all, write own | moderate | full |
| site_content | read | read | full CRUD |

Assign `academy.jbit@gmail.com` as `super_admin`.

## 2. Auth Context & Guards

Enhance `src/lib/auth-context.tsx`:
- Expose `role: 'super_admin' | 'admin' | 'student' | null`, `isAdmin`, `isSuperAdmin`, `loading`
- Fetch role from `user_roles` on session change
- Auto-refresh handled by Supabase (already on); add graceful 401 handling via `onAuthStateChange`
- Clean sign-out: cancel queries, clear cache, `signOut()`, replace-navigate to `/auth`

Route guards:
- Keep `_authenticated/route.tsx` (student+ gate)
- Wrap `admin.tsx` with `useAdmin` → requires `admin` or `super_admin`
- New `_authenticated/admin.settings.*` routes gated to `super_admin` only via a small `useSuperAdmin` hook
- Site-settings + admin management links hidden for non-super-admins

## 3. Server-side permission validation

Add `src/lib/permissions.ts` with predicates used both in UI (hide) and before Supabase mutations (early return with toast). Real enforcement still lives in RLS — this is defense-in-depth + UX.

## 4. Error Pages

New polished pages using existing teal/green design system:
- `src/components/error-pages/{not-found,forbidden,server-error}.tsx`
- Wire into `__root.tsx` `notFoundComponent` + router `defaultErrorComponent`
- Add `/403` route + throw `redirect({ to: '/403' })` when a student hits admin URLs directly

## 5. Performance

- Router already code-splits per route via TanStack file routing — verify all admin routes are under `_authenticated/admin.*` (already are)
- Add `loading="lazy"` + `decoding="async"` to non-hero `<img>` tags in course cards, lesson list, footer/header logos
- Extract shared course-card, lesson-list-item, admin table row into `src/components/shared/*`

## 6. Code cleanup

- Consolidate duplicated Supabase fetch patterns (course by slug, enrollment check, lessons list) into `src/lib/queries/*.ts` hooks
- Centralize types in `src/lib/types.ts` re-exporting from `supabase/types`
- Remove legacy static-data fallbacks in `src/lib/courses.ts` if unused

## 7. Session handling

- On any Supabase error with code `PGRST301` / `401`, toast "সেশন শেষ হয়েছে" and redirect to `/auth`
- Persist session (already default), auto refresh (already default) — verified in client init

## What stays the same

All existing UI, Bengali copy, payment flow, lesson player, CMS editor, and admin course/lesson management remain functional. Only guards, RLS, error surfaces, and shared helpers change.

## Technical notes

- One migration for enum extension + policy rewrites + super_admin grant
- No new dependencies
- `src/lib/use-admin.ts` extended (not replaced) so existing imports keep working
- Files touched: ~20 (auth-context, admin layout, __root, new error components, permissions lib, migration)

Approve to proceed, or tell me what to change.
