import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CourseForm } from "@/components/admin/course-form";

export const Route = createFileRoute("/_authenticated/admin/courses/new")({
  component: NewCoursePage,
});

function NewCoursePage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <Link to="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ফিরে যান
      </Link>
      <h2 className="text-xl font-semibold">নতুন কোর্স যোগ করুন</h2>
      <div className="rounded-lg border border-border bg-card p-6">
        <CourseForm
          submitLabel="কোর্স তৈরি করুন"
          onSubmit={async (v) => {
            const { data: sess } = await supabase.auth.getSession();
            if (!sess.session) {
              throw new Error("সেশন এক্সপায়ার হয়েছে। আবার লগইন করুন।");
            }
            const { data, error } = await supabase.from("courses").insert({
              title: v.title,
              slug: v.slug,
              short_description: v.short_description || null,
              description: v.description || null,
              category: v.category || null,
              level: v.level,
              language: v.language,
              instructor_name: v.instructor_name || null,
              duration: v.duration || null,
              total_lessons: v.total_lessons,
              price: v.price,
              discount_price: v.discount_price,
              thumbnail: v.thumbnail,
              preview_video_url: v.preview_video_url || null,
              published: v.published,
            }).select("id").maybeSingle();
            if (error) {
              console.error("Insert course failed:", error);
              throw new Error(error.message || "কোর্স তৈরি ব্যর্থ");
            }
            void data;
            toast.success("কোর্স তৈরি হয়েছে");
            navigate({ to: "/admin/courses" });
          }}
        />
      </div>
    </div>
  );
}