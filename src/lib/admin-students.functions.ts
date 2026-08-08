import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminStudent = {
  id: string;
  full_name: string | null;
  phone: string | null;
  student_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  created_at: string;
  email: string | null;
  role: string;
  enrollments: number;
  payments: number;
};

const BAN_FOREVER = "87600h";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const listStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStudent[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roles }, { data: enrollments }, { data: payments }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone, student_id, avatar_url, is_active, deactivated_at, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("enrollments").select("user_id"),
        supabaseAdmin.from("payments").select("user_id"),
      ]);

    const emails = new Map<string, string | null>();
    let page = 1;
    while (page <= 20) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) emails.set(u.id, u.email ?? null);
      if (data.users.length < 200) break;
      page += 1;
    }

    const rank = (v: string) => (v === "super_admin" ? 3 : v === "admin" ? 2 : 1);
    const roleOf = new Map<string, string>();
    for (const r of roles ?? []) {
      const prev = roleOf.get(r.user_id);
      if (!prev || rank(r.role) > rank(prev)) roleOf.set(r.user_id, r.role);
    }
    const countBy = (rows: { user_id: string }[] | null) => {
      const m = new Map<string, number>();
      for (const row of rows ?? []) m.set(row.user_id, (m.get(row.user_id) ?? 0) + 1);
      return m;
    };
    const enrollCount = countBy(enrollments as { user_id: string }[] | null);
    const payCount = countBy(payments as { user_id: string }[] | null);

    return (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      student_id: p.student_id,
      avatar_url: p.avatar_url,
      is_active: p.is_active,
      deactivated_at: p.deactivated_at,
      created_at: p.created_at,
      email: emails.get(p.id) ?? null,
      role: roleOf.get(p.id) ?? "student",
      enrollments: enrollCount.get(p.id) ?? 0,
      payments: payCount.get(p.id) ?? 0,
    }));
  });

export const setStudentActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; active: boolean }) => {
    if (!input?.userId || typeof input.active !== "boolean") throw new Error("Invalid input");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("নিজের অ্যাকাউন্টে এই কাজ করা যাবে না।");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((target ?? []).some((r) => r.role === "super_admin")) {
      throw new Error("সুপার অ্যাডমিন অ্যাকাউন্টে এই কাজ করা যাবে না।");
    }

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : BAN_FOREVER,
    });
    if (banError) throw new Error(banError.message);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_active: data.active,
        deactivated_at: data.active ? null : new Date().toISOString(),
        deactivated_by: data.active ? null : context.userId,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    return { ok: true, active: data.active };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; confirmStudentId: string }) => {
    if (!input?.userId || !input?.confirmStudentId) throw new Error("Invalid input");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, student_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("শিক্ষার্থী পাওয়া যায়নি।");
    if ((profile.student_id ?? "") !== data.confirmStudentId) {
      throw new Error("স্টুডেন্ট আইডি মেলেনি। নিশ্চিতকরণ বাতিল হয়েছে।");
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((roles ?? []).some((r) => r.role === "super_admin" || r.role === "admin")) {
      throw new Error("অ্যাডমিন অ্যাকাউন্ট এখান থেকে ডিলিট করা যাবে না।");
    }

    if (profile.student_id) {
      await supabaseAdmin.from("retired_student_ids").upsert(
        {
          student_id: profile.student_id,
          user_id: profile.id,
          full_name: profile.full_name,
          reason: "admin_deleted",
        },
        { onConflict: "student_id" },
      );
    }

    const [{ data: paymentRows }, { data: enrollmentRows }] = await Promise.all([
      supabaseAdmin.from("payments").select("*").eq("user_id", data.userId),
      supabaseAdmin.from("enrollments").select("*").eq("user_id", data.userId),
    ]);
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);

    const { error: archErr } = await supabaseAdmin.from("deleted_student_archive").insert({
      student_id: profile.student_id,
      former_user_id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone,
      email: authUser?.user?.email ?? null,
      payments: (paymentRows ?? []) as unknown as never,
      enrollments: (enrollmentRows ?? []) as unknown as never,
      deleted_by: context.userId,
    });
    if (archErr) throw new Error(archErr.message);

    await supabaseAdmin.from("lesson_notes").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("wishlist").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", data.userId);

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true, retainedStudentId: profile.student_id };
  });
