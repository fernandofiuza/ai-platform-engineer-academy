import type { Metadata } from "next";
import Link from "next/link";
import { Search, Star } from "lucide-react";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLessonsForLearnPage } from "@/modules/curriculum/queries";
import { NoteFormDialog } from "@/modules/notes/components/note-form-dialog";
import { NoteCard } from "@/modules/notes/components/note-card";
import { getAllTagsForUser, getNotes } from "@/modules/notes/queries";

export const metadata: Metadata = { title: "Anotações" };

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; favorite?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const [notes, tags, lessons] = await Promise.all([
    getNotes(userId, {
      search: params.q,
      tag: params.tag,
      favoriteOnly: params.favorite === "1",
    }),
    getAllTagsForUser(userId),
    getLessonsForLearnPage(),
  ]);

  const lessonOptions = lessons.map((l) => ({ id: l.id, title: l.title }));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Anotações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Seu caderno de anotações.</p>
        </div>
        <NoteFormDialog lessonOptions={lessonOptions} />
      </div>

      <form className="flex gap-2" action="/notes">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="Buscar por título ou conteúdo..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        <Button type="button" variant={params.favorite === "1" ? "default" : "outline"} asChild>
          <Link href={params.favorite === "1" ? "/notes" : "/notes?favorite=1"}>
            <Star className="size-4" /> Favoritas
          </Link>
        </Button>
      </form>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link key={tag} href={`/notes?tag=${encodeURIComponent(tag)}`}>
              <Badge variant={params.tag === tag ? "default" : "outline"}>{tag}</Badge>
            </Link>
          ))}
          {params.tag ? (
            <Link href="/notes">
              <Badge variant="secondary">limpar filtro</Badge>
            </Link>
          ) : null}
        </div>
      ) : null}

      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nenhuma anotação encontrada</CardTitle>
            <CardDescription>
              {params.q || params.tag || params.favorite
                ? "Tente outro filtro ou crie uma nova anotação."
                : "Crie sua primeira anotação com o botão acima."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} lessonOptions={lessonOptions} />
          ))}
        </div>
      )}
    </div>
  );
}
