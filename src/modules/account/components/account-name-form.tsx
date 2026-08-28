"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

import { updateNameAction } from "../actions";
import { updateNameSchema, type UpdateNameInput } from "../schema";

export function AccountNameForm({ name, email }: { name: string; email: string }) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdateNameInput>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name },
  });

  function onSubmit(values: UpdateNameInput) {
    startTransition(async () => {
      const result = await updateNameAction(values);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Nome atualizado.");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input value={email} disabled readOnly />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
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
