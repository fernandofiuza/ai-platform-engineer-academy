"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { updateProfileAction } from "../actions";
import { updateProfileSchema, type UpdateProfileInput } from "../schema";

export function ProfileForm({
  bio,
  timezone,
}: {
  bio: string | null;
  timezone: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { bio: bio ?? "", timezone },
  });

  function onSubmit(values: UpdateProfileInput) {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Perfil atualizado.");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conte um pouco sobre você (opcional)"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuso horário</FormLabel>
              <FormControl>
                <Input placeholder="America/Sao_Paulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar
        </Button>
      </form>
    </Form>
  );
}
