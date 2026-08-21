"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createExternalCourseAction, updateExternalCourseAction } from "@/modules/study-hub/actions";
import { EXTERNAL_COURSE_STATUS_LABELS } from "@/modules/study-hub/labels";

type ExternalCourseStatus = "NOT_STARTED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

type ExistingCourse = {
  id: string;
  title: string;
  description: string | null;
  platform: string | null;
  instructor: string | null;
  url: string | null;
  category: string | null;
  status: ExternalCourseStatus;
};

export function ExternalCourseFormDialog({
  existingCourse,
  trigger,
}: {
  existingCourse?: ExistingCourse;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(existingCourse?.title ?? "");
  const [description, setDescription] = React.useState(existingCourse?.description ?? "");
  const [platform, setPlatform] = React.useState(existingCourse?.platform ?? "");
  const [instructor, setInstructor] = React.useState(existingCourse?.instructor ?? "");
  const [url, setUrl] = React.useState(existingCourse?.url ?? "");
  const [category, setCategory] = React.useState(existingCourse?.category ?? "");
  const [status, setStatus] = React.useState<ExternalCourseStatus>(
    existingCourse?.status ?? "NOT_STARTED"
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const payload = {
        title,
        description: description || undefined,
        platform: platform || undefined,
        instructor: instructor || undefined,
        url: url || undefined,
        category: category || undefined,
        status,
      };
      const result = existingCourse
        ? await updateExternalCourseAction({ courseId: existingCourse.id, ...payload })
        : await createExternalCourseAction(payload);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(existingCourse ? "Curso atualizado." : "Curso criado.");
      setOpen(false);
      if (!existingCourse) {
        setTitle("");
        setDescription("");
        setPlatform("");
        setInstructor("");
        setUrl("");
        setCategory("");
        setStatus("NOT_STARTED");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> Novo curso externo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existingCourse ? "Editar curso externo" : "Novo curso externo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="course-title">Nome do curso</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Formação AWS 5.0"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-platform">Plataforma</Label>
              <Input
                id="course-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Ex.: Udemy, YouTube"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-instructor">Instrutor</Label>
              <Input
                id="course-instructor"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-category">Categoria</Label>
              <Input
                id="course-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Cloud, DevOps"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ExternalCourseStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXTERNAL_COURSE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-url">Link (opcional)</Label>
            <Input
              id="course-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-description">Descrição (opcional)</Label>
            <Textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
