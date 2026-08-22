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
  /** Quando informado, cria um submódulo dentro deste módulo em vez de um módulo raiz do curso. */
  parentModuleId: z.string().optional(),
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

export type ImportPreviewModule = {
  title: string;
  lessons: { title: string }[];
  modules: ImportPreviewModule[];
};

/** Recursivo (`z.lazy`) — um módulo pode ter submódulos em qualquer profundidade, espelhando a
 * hierarquia de pastas de uma importação por pasta local. Texto/JSON/IA só geram 1 nível
 * (`modules` fica vazio), então continuam funcionando sem mudança nenhuma. */
const importPreviewModuleSchema: z.ZodType<ImportPreviewModule> = z.lazy(() =>
  z
    .object({
      title: z.string().trim().min(1),
      lessons: z.array(importPreviewLessonSchema).default([]),
      modules: z.array(importPreviewModuleSchema).default([]),
    })
    .refine((m) => m.lessons.length > 0 || m.modules.length > 0, {
      message: "Todo módulo precisa de ao menos uma aula ou submódulo.",
    })
);

export const importTextSchema = z.object({
  rawText: z.string().trim().min(1, "Cole o texto do curso."),
});

export const importJsonSchema = z.object({
  rawJson: z.string().trim().min(1, "Cole o JSON do curso."),
});

type ImportJsonModule = {
  name: string;
  lessons: string[];
  modules: ImportJsonModule[];
};

/** Recursivo — `modules` (submódulos) é opcional/default vazio, então o formato simples de 1
 * nível (usado por texto/JSON colado à mão e pela geração via IA) continua válido sem mudança. */
const importJsonModuleSchema: z.ZodType<ImportJsonModule> = z.lazy(() =>
  z
    .object({
      name: z.string().trim().min(1, 'Todo módulo precisa de um "name".'),
      lessons: z.array(z.string().trim().min(1)).default([]),
      modules: z.array(importJsonModuleSchema).default([]),
    })
    .refine((m) => m.lessons.length > 0 || m.modules.length > 0, {
      message: 'Todo módulo precisa de ao menos uma aula em "lessons" ou um submódulo.',
    })
);

export const importJsonPayloadSchema = z.object({
  course: z.string().trim().min(1, 'Falta o campo "course".'),
  modules: z.array(importJsonModuleSchema).min(1, 'Falta o campo "modules" (com ao menos um módulo).'),
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
export type CommitImportInput = z.infer<typeof commitImportSchema>;
export type ImportPreview = CommitImportInput;
