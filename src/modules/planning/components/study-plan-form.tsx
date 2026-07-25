"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveStudyPlanAction } from "@/modules/planning/actions";
import { parseDateInputValue, toDateInputValue } from "@/modules/planning/format";
import { studyPlanSchema, type StudyPlanInput } from "@/modules/planning/schema";

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function StudyPlanForm({
  initialPlan,
}: {
  initialPlan: {
    availableDays: number[];
    dailyHours: number;
    preferredTime: string | null;
    startDate: Date;
    notes: string | null;
  } | null;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<StudyPlanInput>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      availableDays: initialPlan?.availableDays ?? [1, 2, 3, 4, 5],
      dailyHours: initialPlan?.dailyHours ?? 3.5,
      preferredTime: initialPlan?.preferredTime ?? "",
      startDate: initialPlan?.startDate ?? new Date(),
      notes: initialPlan?.notes ?? "",
    },
  });

  const [availableDays, setAvailableDays] = React.useState(
    initialPlan?.availableDays ?? [1, 2, 3, 4, 5]
  );

  function toggleDay(day: number) {
    const next = availableDays.includes(day)
      ? availableDays.filter((d) => d !== day)
      : [...availableDays, day].sort();
    setAvailableDays(next);
    form.setValue("availableDays", next, { shouldValidate: true });
  }

  function onSubmit(values: StudyPlanInput) {
    startTransition(async () => {
      const result = await saveStudyPlanAction(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Planejador salvo.");
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Dias disponíveis</Label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                availableDays.includes(day.value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {day.label}
            </button>
          ))}
        </div>
        {form.formState.errors.availableDays ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.availableDays.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="dailyHours">Carga diária (horas)</Label>
          <Input
            id="dailyHours"
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            {...form.register("dailyHours", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredTime">Horário preferido</Label>
          <Input id="preferredTime" placeholder="Ex.: 19h" {...form.register("preferredTime")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Data de início</Label>
          <Input
            id="startDate"
            type="date"
            defaultValue={toDateInputValue(form.getValues("startDate"))}
            onChange={(e) => form.setValue("startDate", parseDateInputValue(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Férias, pausas e indisponibilidades (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Ex.: sem estudo entre 20/12 e 05/01"
          rows={2}
          {...form.register("notes")}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar planejador
      </Button>
    </form>
  );
}
