"use client";

import * as React from "react";

import { recordExternalLessonViewAction } from "@/modules/study-hub/actions";

export function LessonViewRecorder({ lessonId }: { lessonId: string }) {
  React.useEffect(() => {
    void recordExternalLessonViewAction(lessonId);
  }, [lessonId]);

  return null;
}
