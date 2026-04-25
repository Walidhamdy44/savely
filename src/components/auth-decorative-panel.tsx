"use client";

export function AuthDecorativePanel({
  headline,
  subtext,
}: {
  headline: string;
  subtext: string;
}) {
  return (
    <div className="relative hidden lg:flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#150c07]">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Purple glow top-right */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#A855F7]/8 blur-[120px]" />
        {/* Orange glow bottom-left */}
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#FF8C42]/6 blur-[140px]" />
        {/* Purple glow center */}
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#6f00be]/10 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex max-w-lg flex-col items-center gap-12 px-12 text-center">
        {/* Headline */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-[#f2dfd5] leading-[1.1]">
            {headline}
          </h2>
          <p className="text-base leading-relaxed text-[#a48c7f]">{subtext}</p>
        </div>

        {/* Floating cards */}
        <div className="relative h-[340px] w-full">
          {/* YouTube card */}
          <div className="absolute left-4 top-0 w-[260px] rotate-[-4deg] rounded-3xl bg-[#281d18] p-4 shadow-2xl shadow-black/30 transition-transform hover:rotate-0 hover:scale-105">
            <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#1b110c]">
              <div className="flex aspect-video items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/90">
                  <svg
                    className="ml-1 h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute left-2 top-2">
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/20">
                  YouTube
                </span>
              </div>
            </div>
            <p className="text-xs font-medium text-[#f2dfd5] line-clamp-1">
              Building a Full-Stack App with Next.js
            </p>
            <p className="mt-1 text-[10px] text-[#564338]">
              Fireship · 2.1M views
            </p>
          </div>

          {/* LinkedIn card */}
          <div className="absolute right-2 top-8 w-[240px] rotate-[3deg] rounded-3xl bg-[#281d18] p-4 shadow-2xl shadow-black/30 transition-transform hover:rotate-0 hover:scale-105">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-sky-400">in</span>
              </div>
              <div>
                <p className="text-xs font-medium text-[#f2dfd5]">Sarah Chen</p>
                <p className="text-[10px] text-[#564338]">
                  Senior Engineer at Google
                </p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-[#a48c7f] line-clamp-3">
              Just shipped a new feature that reduced our API latency by 40%.
              Here&apos;s what I learned about caching strategies...
            </p>
            <div className="mt-2">
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
                LinkedIn
              </span>
            </div>
          </div>

          {/* GitHub card */}
          <div className="absolute bottom-0 left-1/2 w-[230px] -translate-x-1/2 rotate-[1deg] rounded-3xl bg-[#281d18] p-4 shadow-2xl shadow-black/30 transition-transform hover:rotate-0 hover:scale-105">
            <div className="mb-2 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-[#f2dfd5]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <p className="text-xs font-medium text-[#f2dfd5]">
                vercel/next.js
              </p>
            </div>
            <p className="text-[11px] text-[#a48c7f] line-clamp-2">
              The React Framework for the Web
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-[#564338]">
                <svg
                  className="h-3 w-3 text-[#f5c518]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
                </svg>
                128k
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#564338]">
                <span className="h-2 w-2 rounded-full bg-[#3178c6]" />
                TypeScript
              </span>
            </div>
          </div>
        </div>

        {/* Platform badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-red-400/70 border border-red-500/10">
            YouTube
          </span>
          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-sky-400/70 border border-sky-500/10">
            LinkedIn
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#a48c7f]/70 border border-white/5">
            GitHub
          </span>
          <span className="rounded-full bg-pink-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-pink-400/70 border border-pink-500/10">
            Instagram
          </span>
        </div>
      </div>
    </div>
  );
}
