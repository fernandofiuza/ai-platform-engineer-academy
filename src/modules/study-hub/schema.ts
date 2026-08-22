import { z } from "zod";

const externalCourseStatuses = ["NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED"] as const;

export const createExternalCourseSchema = z.object({
  title: z.string().trim().min(2, "Informe um título."),
  description: z.string().trim().max(2000).optional(),
  platform: z.string().trim().max(100).optional(),
  instructor: z.string().trim().max(100).optional(),
  url: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  category: z.string().trim().max(100).optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  status: z.enum(externalCourseStatuses).default("NOT_STARTED"),
});

export const updateExternalCourseSchema = createExternalCourseSchema.extend({
  courseId: z.string().min(1),
});

export const createExternalModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2, "Informe um título."),
});

export const updateExternalModuleSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2, "Informe um título."),
});

export const createExternalLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().trim().min(2, "Informe um título."),
});

export const updateExternalLessonSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(2, "Informe um título."),
});

const importPreviewLessonSchema = z.object({
  title: z.string().trim().min(1),
});

const importPreviewModuleSchema = z.object({
  title: z.string().trim().min(1),
  lessons: z.array(importPreviewLessonSchema).min(1, "Cada módulo precisa de ao menos uma aula."),
});

export const importTextSchema = z.object({
  rawText: z.string().trim().min(1, "Cole o texto do curso."),
});

export const importJsonSchema = z.object({
  rawJson: z.string().trim().min(1, "Cole o JSON do curso."),
});

export const generateWithAiSchema = z.object({
  topic: z.string().trim().min(2, "Descreva o curso ou tópico que você quer estudar.").max(200),
});

export const importJsonPayloadSchema = z.object({
  course: z.string().trim().min(1, 'Falta o campo "course".'),
  modules: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Todo módulo precisa de um "name".'),
        lessons: z
          .array(z.string().trim().min(1))
          .min(1, 'Todo módulo precisa de ao menos uma aula em "lessons".'),
      })
    )
    .min(1, 'Falta o campo "modules" (com ao menos um módulo).'),
});

export const commitImportSchema = z.object({
  title: z.string().trim().min(2, "Informe um título."),
  modules: z.array(importPreviewModuleSchema).min(1, "Adicione ao menos um módulo."),
});

export type CreateExternalCourseInput = z.infer<typeof createExternalCourseSchema>;
export type UpdateExternalCourseInput = z.infer<typeof updateExternalCourseSchema>;
export type CreateExternalModuleInput = z.infer<typeof createExternalModuleSchema>;
export type UpdateExternalModuleInput = z.infer<typeof updateExternalModuleSchema>;
export type CreateExternalLessonInput = z.infer<typeof createExternalLessonSchema>;
export type UpdateExternalLessonInput = z.infer<typeof updateExternalLessonSchema>;
export type ImportTextInput = z.infer<typeof importTextSchema>;
export type ImportJsonInput = z.infer<typeof importJsonSchema>;
export type GenerateWithAiInput = z.infer<typeof generateWithAiSchema>;
export type CommitImportInput = z.infer<typeof commitImportSchema>;
export type ImportPreview = CommitImportInput;
