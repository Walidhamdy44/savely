"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  url: z.string().url("Must be a valid URL"),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function AddPostDialog() {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      thumbnail: "",
    },
  });

  const saveMutation = useMutation(
    trpc.posts.save.mutationOptions({
      onSuccess: () => {
        toast.success("Post saved");
        form.reset();
        setOpen(false);
        void queryClient.invalidateQueries({ queryKey: [["posts"]] });
      },
      onError: () => {
        toast.error("Failed to save post");
      },
    }),
  );

  function onSubmit(values: FormValues) {
    const externalId = btoa(values.url).slice(0, 32);

    saveMutation.mutate({
      platform: "manual",
      externalId,
      title: values.title,
      url: values.url,
      description: values.description || undefined,
      thumbnail:
        values.thumbnail && values.thumbnail.length > 0
          ? values.thumbnail
          : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 rounded-xl bg-[#FF8C42] px-5 text-[#532200] font-semibold hover:bg-[#FFB68D] shadow-lg shadow-[#FF8C42]/20">
            <Plus className="h-4 w-4" />
            Add link
          </Button>
        }
      />

      <DialogContent className="border-[rgba(255,255,255,0.06)] bg-[#281d18] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#f2dfd5]">
            Save a link manually
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm text-[#a48c7f]">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Article title"
              className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#1b110c] text-[#f2dfd5] placeholder:text-[#564338] focus:border-[#FF8C42] focus:ring-[#FF8C42]/20"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-400">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm text-[#a48c7f]">
              URL
            </Label>
            <Input
              id="url"
              placeholder="https://example.com/article"
              type="url"
              className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#1b110c] text-[#f2dfd5] placeholder:text-[#564338] focus:border-[#FF8C42] focus:ring-[#FF8C42]/20"
              {...form.register("url")}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-red-400">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-[#a48c7f]">
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="A brief note about this link"
              className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#1b110c] text-[#f2dfd5] placeholder:text-[#564338] focus:border-[#FF8C42] focus:ring-[#FF8C42]/20"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-400">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-sm text-[#a48c7f]">
              Thumbnail URL (optional)
            </Label>
            <Input
              id="thumbnail"
              placeholder="https://example.com/image.jpg"
              type="url"
              className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#1b110c] text-[#f2dfd5] placeholder:text-[#564338] focus:border-[#FF8C42] focus:ring-[#FF8C42]/20"
              {...form.register("thumbnail")}
            />
            {form.formState.errors.thumbnail && (
              <p className="text-sm text-red-400">
                {form.formState.errors.thumbnail.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-xl bg-[#FF8C42] text-[#532200] font-semibold hover:bg-[#FFB68D]"
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
