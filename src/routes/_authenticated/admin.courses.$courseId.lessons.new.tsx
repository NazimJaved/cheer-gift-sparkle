import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LessonForm } from "@/components/admin/lesson-form";

export const Route = createFileRoute("/_authenticated/admin/courses/$courseId/lessons/new")({
  component: NewLessonPage,
});

function NewLessonPage() {
  const { courseId } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/admin/courses/$courseId/lessons"
        params={{ courseId }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> লেসন তালিকা
      </Link>
      <h2 className="mt-2 mb-6 text-xl font-semibold">নতুন লেসন</h2>
      <LessonForm courseId={courseId} />
    </div>
  );
}