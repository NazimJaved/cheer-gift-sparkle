This is a large upgrade. I'll ship it in focused, testable phases so nothing existing breaks. Bengali UI is preserved throughout.

## Phase 1 — Database (single migration)

New tables (all with RLS scoped to `auth.uid()`, GRANTs to `authenticated` + `service_role`):

- `lesson_notes` — user_id, lesson_id, course_id, content, timestamps. Student CRUD own rows.
- `lesson_resources` — lesson_id, title, url, type (pdf/link/file), order. Public read for enrolled; admin write.
- `wishlist` — user_id, course_id, created_at. Student CRUD own rows.
- `notifications` — user_id, type, title, body, link, read_at, created_at. Student read/update own; service_role insert.
- `achievements` — user_id, kind (course_complete/streak/etc), course_id nullable, metadata jsonb, earned_at.
- `learning_streaks` — user_id (pk), current_streak, longest_streak, last_active_date.

Extend `profiles`: `avatar_url text`.

Triggers:
- On `enrollments` insert → notification "কোর্স আনলক হয়েছে".
- On `payments` status→approved → notification "পেমেন্ট অনুমোদিত".
- On `lesson_progress` completed=true → notification + achievement check (if all course lessons complete → course_complete achievement).
- On `auth.users` new user (extend `handle_new_user`) → welcome notification.

New storage bucket: `avatars` (private, signed URLs) with policies for owner-only writes.

## Phase 2 — Shared libs & hooks

- `src/lib/db-progress.ts`: hooks `useCourseProgress(courseId)`, `useAllEnrolledProgress()` returning `{completedCount, totalLessons, percent, lastLesson, estimatedRemainingMinutes}`.
- `src/lib/db-notifications.ts`: list + mark-read + unread count (realtime channel).
- `src/lib/db-wishlist.ts`: toggle/list.
- `src/lib/db-notes.ts`, `src/lib/db-resources.ts`.
- `src/lib/db-achievements.ts`.
- Small `useQueryClient`-friendly caching via TanStack Query for these hooks.

## Phase 3 — Student pages

- **Dashboard** (`/dashboard`) redesigned with sections:
  1. Continue Learning (last watched lesson card, big CTA)
  2. Active Courses (progress %, bar, last lesson, remaining time)
  3. Recently Watched (last 5 lessons)
  4. Completed Courses
  5. Wishlist
  6. Recommended (published courses not enrolled/wishlisted)
- **Profile** (`/profile`): edit full_name/phone, avatar upload, change password, learning statistics (courses enrolled/completed, lessons watched, total minutes, current streak, achievements grid).
- **Notifications** (`/notifications`): list + mark all read; bell icon with unread badge in header.
- **Wishlist** (`/wishlist`): grid + remove.

## Phase 4 — Video experience

Upgrade `learn.$courseSlug.$lessonSlug.tsx`:
- Auto-save progress every 15s and on visibility change (already partial — extend).
- Prev/Next lesson buttons wired to course order.
- Keyboard shortcuts: `←`/`→` prev/next lesson, `f` fullscreen, `n` toggle notes.
- Fullscreen API on player container.
- Notes panel (tabbed with Resources): create/edit/delete personal notes per lesson.
- Resources panel: list downloadable/external resources (admin-managed).
- Curriculum sidebar showing chapters + lessons with completion state.
- Playback speed: expose via YT IFrame API postMessage `setPlaybackRate`.

## Phase 5 — Mobile & performance

- Sticky bottom nav on mobile (`<md`) for signed-in students: Home / Courses / Dashboard / Notifications / Profile.
- Route-level lazy loading via TanStack `defaultPreload="intent"`; heavy components (notes editor, resources) code-split.
- TanStack Query caching (`staleTime: 60s`) for dashboard queries.
- Skeleton loaders on dashboard cards.

## Phase 6 — Admin additions (minimal)

- Lesson form gets a Resources sub-editor (list add/remove).

## Out of scope (structure only, not full UX)

- Streaks are recorded and displayed but no gamified reminders.
- Achievements shown as badges; no share/export.
- Wishlist toggle button appears on course cards.

## Technical notes

Stack: existing TanStack Start + Supabase browser client + TanStack Query. No new deps required beyond what's already installed. Bengali labels used across UI; keeping teal/green tokens from current design system.

Given scale, I'll implement in this order and verify build between phases: **1 → 2 → 3 → 4 → 5 → 6**. Reply "go" to proceed, or tell me which phases to skip / reorder.