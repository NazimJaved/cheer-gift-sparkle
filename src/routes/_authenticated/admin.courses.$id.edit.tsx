import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CourseForm, type CourseFormValues } from "@/components/admin/course-form";

export const Route = createFileRoute("/_authenticated/admin/courses/$id/edit")({
  component: EditCoursePage,
});

function EditCoursePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<CourseFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!data) {
          setNotFound(true);
          return;
        }
        setInitial({
          title: data.title,
          slug: data.slug,
          short_description: data.short_description ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          level: (data.level ?? "beginner") as CourseFormValues["level"],
          language: data.language ?? "Bengali",
          instructor_name: data.instructor_name ?? "",
          duration: data.duration ?? "",
          total_lessons: data.total_lessons ?? 0,
          price: Number(data.price ?? 0),
          discount_price: data.discount_price != null ? Number(data.discount_price) : null,
          thumbnail: data.thumbnail,
          preview_video_url: data.preview_video_url ?? "",
          published: data.published,
        });
      });
  }, [id]);

  if (notFound) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">কোর্স পাওয়া যায়নি</div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> ফিরে যান
      </Link>
      <h2 className="text-xl font-semibold">কোর্স সম্পাদনা</h2>
      <div className="rounded-lg border border-border bg-card p-6">
        {!initial ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
          </div>
        ) : (
          <CourseForm
            initial={initial}
            submitLabel="পরিবর্তন সংরক্ষণ করুন"
            onSubmit={async (v) => {
              const { error } = await supabase
                .from("courses")
                .update({
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
                })
                .eq("id", id);
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("সংরক্ষিত হয়েছে");
              navigate({ to: "/admin/courses" });
            }}
          />
        )}
      </div>
    </div>
  );
}