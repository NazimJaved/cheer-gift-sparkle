import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Save, Trophy, Flame, BookOpen, CheckCircle2, Check, Shuffle } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAchievements, useLearningStreak } from "@/lib/db-achievements";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const AVATAR_STYLES = ["avataaars", "adventurer", "big-smile", "bottts", "fun-emoji", "lorelei", "micah", "notionists", "personas", "thumbs"] as const;
function avatarUrlFor(seed: string, style: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [stats, setStats] = useState({
    enrolled: 0,
    completedCourses: 0,
    lessonsCompleted: 0,
    minutesWatched: 0,
  });
  const achievements = useAchievements();
  const streak = useLearningStreak();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setFullName(data?.full_name ?? "");
      setPhone(data?.phone ?? "");
      setAvatarUrl(data?.avatar_url ?? null);

      const [{ data: en }, { data: prog }, { data: ach }] = await Promise.all([
        supabase.from("enrollments").select("course_id").eq("user_id", user.id),
        supabase
          .from("lesson_progress")
          .select("completed, lesson:lessons(duration)")
          .eq("user_id", user.id),
        supabase
          .from("achievements")
          .select("kind")
          .eq("user_id", user.id)
          .eq("kind", "course_complete"),
      ]);
      const rows = (prog ?? []) as Array<{ completed: boolean; lesson: { duration: string | null } | null }>;
      const lessonsCompleted = rows.filter((r) => r.completed).length;
      const minutesWatched = rows
        .filter((r) => r.completed && r.lesson?.duration)
        .reduce((s, r) => {
          const m = r.lesson!.duration!.match(/(\d+)/);
          return s + (m ? parseInt(m[1], 10) : 0);
        }, 0);
      setStats({
        enrolled: (en ?? []).length,
        completedCourses: (ach ?? []).length,
        lessonsCompleted,
        minutesWatched,
      });
      setLoading(false);
    })();
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, phone: phone || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("প্রোফাইল আপডেট হয়েছে");
  }

  async function selectAvatar(url: string) {
    if (!user) return;
    setSavingAvatar(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setSavingAvatar(false);
    if (error) return toast.error(error.message);
    setAvatarUrl(url);
    setPickerOpen(false);
    toast.success("অ্যাভাটার আপডেট হয়েছে");
  }

  async function changePassword() {
    if (password.length < 6) return toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের");
    if (password !== password2) return toast.error("পাসওয়ার্ড মিলছে না");
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setChangingPassword(false);
    if (error) return toast.error(error.message);
    setPassword("");
    setPassword2("");
    toast.success("পাসওয়ার্ড পরিবর্তিত হয়েছে");
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      </SiteLayout>
    );
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">প্রোফাইল</h1>

        {/* Avatar */}
        <div className="mt-6 flex items-center gap-5 rounded-2xl border border-border bg-card p-5">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-teal/15 text-2xl font-bold text-teal">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (fullName || user?.email || "?")[0].toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold">{fullName || user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              <Shuffle className="h-3.5 w-3.5" /> অ্যাভাটার বাছাই করুন
            </button>
          </div>
        </div>

        {pickerOpen && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">একটি অ্যাভাটার নির্বাচন করুন</h3>
              {savingAvatar && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
              {AVATAR_STYLES.flatMap((style) =>
                [user?.id ?? "u", user?.email ?? "e", fullName || "n", style, `${style}-2`, `${style}-3`].map((seed) => {
                  const url = avatarUrlFor(seed, style);
                  const selected = avatarUrl === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => selectAvatar(url)}
                      className={`relative aspect-square overflow-hidden rounded-full border-2 bg-teal/5 transition ${
                        selected ? "border-teal ring-2 ring-teal/40" : "border-transparent hover:border-teal/50"
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      {selected && (
                        <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-teal text-teal-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Learning stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="এনরোলড কোর্স" value={stats.enrolled} />
          <StatCard icon={<Trophy className="h-5 w-5" />} label="সম্পন্ন কোর্স" value={stats.completedCourses} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="সম্পন্ন লেসন" value={stats.lessonsCompleted} />
          <StatCard
            icon={<Flame className="h-5 w-5" />}
            label="স্ট্রিক"
            value={streak?.current_streak ?? 0}
            hint={streak?.longest_streak ? `সেরা ${streak.longest_streak}` : undefined}
          />
        </div>

        {/* Achievements */}
        <div className="mt-8">
          <h2 className="text-lg font-bold">অ্যাচিভমেন্ট</h2>
          {achievements.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">এখনো কোনো অ্যাচিভমেন্ট নেই। লেসন সম্পন্ন করে ব্যাজ অর্জন করুন।</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br from-teal/5 to-green/10 p-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-teal text-teal-foreground shadow">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {a.kind === "course_complete" ? "কোর্স সম্পন্ন" : a.kind}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {(a.metadata?.title as string) ?? ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit profile */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">প্রোফাইল আপডেট</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">নাম</label>
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">মোবাইল</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:bg-teal/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সংরক্ষণ
          </button>
        </div>

        {/* Change password */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Lock className="h-5 w-5" /> পাসওয়ার্ড পরিবর্তন
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="password"
              placeholder="নতুন পাসওয়ার্ড"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="আবার লিখুন"
              className={inputCls}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>
          <button
            onClick={changePassword}
            disabled={changingPassword}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-60"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} পরিবর্তন করুন
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-teal">{icon}<span className="text-xs font-medium text-muted-foreground">{label}</span></div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}