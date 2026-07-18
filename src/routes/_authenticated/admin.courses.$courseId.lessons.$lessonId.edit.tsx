import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LessonForm } from "@/components/admin/lesson-form";
import type { Lesson } from "@/lib/lessons";

export const Route = createFileRoute(
  "/_authenticated/admin/courses/$courseId/lessons/$lessonId/edit",
)({
  component: EditLessonPage,
});

function EditLessonPage() {
  const { courseId, lessonId } = Route.useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .maybeSingle();
      if (error) toast.error(error.message);
      setLesson((data as Lesson | null) ?? null);
      setLoading(false);
    })();
  }, [lessonId]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/admin/courses/$courseId/lessons"
        params={{ courseId }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> লেসন তালিকা
      </Link>
      <h2 className="mt-2 mb-6 text-xl font-semibold">লেসন সম্পাদনা</h2>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
        </div>
      ) : !lesson ? (
        <p className="text-sm text-muted-foreground">লেসন পাওয়া যায়নি।</p>
      ) : (
        <LessonForm courseId={courseId} lesson={lesson} />
      )}
    </div>
  );
}