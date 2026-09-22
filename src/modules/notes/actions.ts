"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageProvider } from "@/lib/storage";
import { validateAttachment } from "./attachments";
import { createNoteSchema, updateNoteSchema, type CreateNoteInput, type UpdateNoteInput } from "./schema";

export async function createNoteAction(input: CreateNoteInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const note = await db.note.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      contentMarkdown: parsed.data.contentMarkdown,
      template: parsed.data.template,
      tags: parsed.data.tags,
      scopeType: parsed.data.lessonId
        ? "LESSON"
        : parsed.data.externalLessonId
          ? "EXTERNAL_LESSON"
          : parsed.data.weekId
            ? "WEEK"
            : "GENERAL",
      scopeId: parsed.data.lessonId || parsed.data.externalLessonId || parsed.data.weekId || null,
      topics: { create: parsed.data.topicIds.map((topicId) => ({ topicId })) },
    },
    select: { id: true },
  });

  revalidatePath("/notes");
  if (parsed.data.lessonId) revalidatePath(`/learn/${parsed.data.lessonId}`);
  if (parsed.data.externalLessonId) revalidatePath("/study-hub", "layout");
  if (parsed.data.weekId) revalidatePath(`/roadmap/${parsed.data.weekId}`);
  if (parsed.data.topicIds.length > 0) revalidatePath("/roadmap");
  return { error: null, noteId: note.id };
}

async function assertOwnedNote(userId: string, noteId: string) {
  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) return null;
  return note;
}

export async function updateNoteAction(input: UpdateNoteInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const note = await assertOwnedNote(session.user.id, parsed.data.noteId);
  if (!note) return { error: "Anotação não encontrada." };

  await db.note.update({
    where: { id: parsed.data.noteId },
    data: {
      title: parsed.data.title,
      contentMarkdown: parsed.data.contentMarkdown,
      template: parsed.data.template,
      tags: parsed.data.tags,
      scopeType: parsed.data.lessonId
        ? "LESSON"
        : parsed.data.externalLessonId
          ? "EXTERNAL_LESSON"
          : parsed.data.weekId
            ? "WEEK"
            : "GENERAL",
      scopeId: parsed.data.lessonId || parsed.data.externalLessonId || parsed.data.weekId || null,
      topics: {
        deleteMany: {},
        create: parsed.data.topicIds.map((topicId) => ({ topicId })),
      },
    },
  });

  revalidatePath("/notes");
  if (parsed.data.lessonId) revalidatePath(`/learn/${parsed.data.lessonId}`);
  if (note.scopeType === "LESSON" && note.scopeId && note.scopeId !== parsed.data.lessonId) {
    revalidatePath(`/learn/${note.scopeId}`);
  }
  if (parsed.data.externalLessonId || note.scopeType === "EXTERNAL_LESSON") {
    revalidatePath("/study-hub", "layout");
  }
  if (parsed.data.weekId) revalidatePath(`/roadmap/${parsed.data.weekId}`);
  if (note.scopeType === "WEEK" && note.scopeId && note.scopeId !== parsed.data.weekId) {
    revalidatePath(`/roadmap/${note.scopeId}`);
  }
  revalidatePath("/roadmap");
  return { error: null };
}

export async function toggleFavoriteAction(noteId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const note = await assertOwnedNote(session.user.id, noteId);
  if (!note) return { error: "Anotação não encontrada." };

  await db.note.update({ where: { id: noteId }, data: { isFavorite: !note.isFavorite } });
  revalidatePath("/notes");
  return { error: null };
}

export async function deleteNoteAction(noteId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const note = await assertOwnedNote(session.user.id, noteId);
  if (!note) return { error: "Anotação não encontrada." };

  const attachments = await db.noteAttachment.findMany({
    where: { noteId },
    select: { storageKey: true },
  });

  await db.note.delete({ where: { id: noteId } });
  await Promise.all(attachments.map((a) => storageProvider.delete(a.storageKey)));

  revalidatePath("/notes");
  if (note.scopeType === "LESSON" && note.scopeId) revalidatePath(`/learn/${note.scopeId}`);
  if (note.scopeType === "EXTERNAL_LESSON") revalidatePath("/study-hub", "layout");
  return { error: null };
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function uploadNoteAttachmentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const noteId = formData.get("noteId");
  const file = formData.get("file");
  if (typeof noteId !== "string" || !noteId) return { error: "Anotação inválida." };
  if (!(file instanceof File)) return { error: "Arquivo inválido." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Arquivo maior que 10MB." };

  const note = await assertOwnedNote(session.user.id, noteId);
  if (!note) return { error: "Anotação não encontrada." };

  const validated = validateAttachment(file);
  if (!validated.ok) return { error: validated.error };

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storageProvider.save({ buffer, extension: validated.extension });

  await db.noteAttachment.create({
    data: {
      noteId,
      originalName: validated.sanitizedName,
      storageKey: stored.key,
      mimeType: validated.mimeType,
      size: stored.size,
    },
  });

  revalidatePath("/notes");
  if (note.scopeType === "LESSON" && note.scopeId) revalidatePath(`/learn/${note.scopeId}`);
  if (note.scopeType === "EXTERNAL_LESSON") revalidatePath("/study-hub", "layout");
  if (note.scopeType === "WEEK" && note.scopeId) revalidatePath(`/roadmap/${note.scopeId}`);
  return { error: null };
}

export async function deleteNoteAttachmentAction(attachmentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const attachment = await db.noteAttachment.findUnique({
    where: { id: attachmentId },
    include: { note: { select: { userId: true, scopeType: true, scopeId: true } } },
  });
  if (!attachment || attachment.note.userId !== session.user.id) {
    return { error: "Anexo não encontrado." };
  }

  await db.noteAttachment.delete({ where: { id: attachmentId } });
  await storageProvider.delete(attachment.storageKey);

  revalidatePath("/notes");
  if (attachment.note.scopeType === "LESSON" && attachment.note.scopeId) {
    revalidatePath(`/learn/${attachment.note.scopeId}`);
  }
  if (attachment.note.scopeType === "EXTERNAL_LESSON") revalidatePath("/study-hub", "layout");
  if (attachment.note.scopeType === "WEEK" && attachment.note.scopeId) {
    revalidatePath(`/roadmap/${attachment.note.scopeId}`);
  }
  return { error: null };
}
