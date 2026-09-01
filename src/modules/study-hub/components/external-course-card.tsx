import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExternalCourseDeleteButton } from "@/modules/study-hub/components/external-course-delete-button";
import {
  EXTERNAL_COURSE_STATUS_BADGE_VARIANT,
  EXTERNAL_COURSE_STATUS_LABELS,
} from "@/modules/study-hub/labels";

type ExternalCourseStatus = "NOT_STARTED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

export function ExternalCourseCard({
  course,
}: {
  course: {
    id: string;
    title: string;
    platform: string | null;
    status: ExternalCourseStatus;
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
  };
}) {
  return (
    <Link href={`/study-hub/courses/${course.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{course.title}</CardTitle>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant={EXTERNAL_COURSE_STATUS_BADGE_VARIANT[course.status]}>
                {EXTERNAL_COURSE_STATUS_LABELS[course.status]}
              </Badge>
              <ExternalCourseDeleteButton courseId={course.id} courseTitle={course.title} />
            </div>
          </div>
          {course.platform ? (
            <p className="text-sm text-muted-foreground">{course.platform}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Progress value={course.progressPercent} className="h-2" />
            <span className="shrink-0 text-sm font-medium">{course.progressPercent}%</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {course.completedLessons} / {course.totalLessons} aulas
            </span>
            <span className="inline-flex items-center gap-1 text-foreground">
              Continuar <ArrowRight className="size-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
