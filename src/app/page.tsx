import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BookmarkCheck, GitBranch, Play, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      {/* Logo */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <BookmarkCheck className="h-7 w-7" />
      </div>

      {/* Headline */}
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Social Aggregator
        </h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          One place for everything you want to revisit — YouTube videos, GitHub
          stars, and your own bookmarks.
        </p>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Play className="h-3.5 w-3.5 text-red-600" />
          YouTube
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <GitBranch className="h-3.5 w-3.5" />
          GitHub
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Link2 className="h-3.5 w-3.5 text-blue-600" />
          Manual links
        </Badge>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ size: "lg" }), "px-6")}
        >
          Get started free
        </Link>
        <Link
          href="/sign-in"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "px-6",
          )}
        >
          Sign in
        </Link>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground">
        No subscription required. Free forever for personal use.
      </p>
    </main>
  );
}
