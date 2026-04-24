import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Bookmark, Play, GitBranch, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      {/* Logo */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF8C42] shadow-lg shadow-[#FF8C42]/20">
        <Bookmark className="h-7 w-7 text-[#532200]" />
      </div>

      {/* Headline */}
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-[#f2dfd5] sm:text-6xl">
          Unified Content Hub
        </h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-[#a48c7f]">
          One place for everything you want to revisit — YouTube videos,
          LinkedIn posts, GitHub stars, and your own bookmarks.
        </p>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap justify-center gap-3">
        <span className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/20">
          <Play className="h-3.5 w-3.5" />
          YouTube
        </span>
        <span className="flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 border border-sky-500/20">
          <Link2 className="h-3.5 w-3.5" />
          LinkedIn
        </span>
        <span className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-[#f2dfd5] border border-white/10">
          <GitBranch className="h-3.5 w-3.5" />
          GitHub
        </span>
        <span className="flex items-center gap-2 rounded-full bg-[#FF8C42]/10 px-4 py-2 text-sm font-medium text-[#FFB68D] border border-[#FF8C42]/20">
          <Link2 className="h-3.5 w-3.5" />
          Manual links
        </span>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center rounded-xl bg-[#FF8C42] px-8 py-3 text-base font-semibold text-[#532200] shadow-lg shadow-[#FF8C42]/20 transition-colors hover:bg-[#FFB68D]"
        >
          Get started free
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-transparent px-8 py-3 text-base font-medium text-[#a48c7f] transition-colors hover:bg-[#332822] hover:text-[#f2dfd5]"
        >
          Sign in
        </Link>
      </div>

      {/* Footer note */}
      <p className="text-xs text-[#564338]">
        No subscription required. Free forever for personal use.
      </p>
    </main>
  );
}
