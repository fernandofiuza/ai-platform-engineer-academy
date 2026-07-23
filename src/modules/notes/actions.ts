"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNoteSchema, updateNoteSchema, type CreateNoteInput, type UpdateNoteInput } from "./schema";

export async function createNoteAction(input: CreateNoteInput) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.note.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      contentMarkdown: parsed.data.contentMarkdown,
      template: parsed.data.template,
      tags: parsed.data.tags,
      scopeType: parsed.data.lessonId ? "LESSON" : "GENERAL",
      scopeId: parsed.data.lessonId || null,
    },
  });

  revalidatePath("/notes");
  return { error: null };
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
      scopeType: parsed.data.lessonId ? "LESSON" : "GENERAL",
      scopeId: parsed.data.lessonId || null,
    },
  });

  revalidatePath("/notes");
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

  await db.note.delete({ where: { id: noteId } });
  revalidatePath("/notes");
  return { error: null };
}
