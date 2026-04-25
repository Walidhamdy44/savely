import { SignIn } from "@clerk/nextjs";
import { AuthDecorativePanel } from "@/components/auth-decorative-panel";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-[#1b110c]">
      {/* Left — Auth form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[480px] lg:shrink-0 xl:w-[520px]">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
              <img src="/icon.svg" alt="Savely" className="h-10 w-10" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#f2dfd5]">
              Savely
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#f2dfd5]">
              Welcome back
            </h1>
            <p className="text-sm text-[#a48c7f]">
              Sign in to your account to continue
            </p>
          </div>

          {/* Clerk SignIn component */}
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none",
                card: "bg-transparent shadow-none p-0 gap-6 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-transparent border border-[rgba(255,255,255,0.08)] text-[#a48c7f] hover:bg-[#281d18] hover:text-[#f2dfd5] rounded-xl h-11 font-medium transition-colors",
                socialButtonsBlockButtonText: "text-sm font-medium",
                socialButtonsProviderIcon: "w-5 h-5",
                dividerLine: "bg-[rgba(255,255,255,0.06)]",
                dividerText: "text-[#564338] text-xs uppercase tracking-wider",
                formFieldLabel: "text-[#a48c7f] text-sm font-medium mb-1.5",
                formFieldInput:
                  "bg-[#14161a] border-[rgba(255,255,255,0.06)] text-[#f2dfd5] rounded-xl h-11 px-4 text-sm placeholder:text-[#564338] focus:border-[#FF8C42] focus:ring-1 focus:ring-[#FF8C42]/30 transition-all",
                formButtonPrimary:
                  "bg-[#FF8C42] hover:bg-[#FFB68D] text-[#532200] font-semibold rounded-xl h-11 text-sm shadow-lg shadow-[#FF8C42]/20 transition-colors",
                footerAction: "hidden",
                footerActionLink:
                  "text-[#FF8C42] hover:text-[#FFB68D] font-medium",
                footer: "hidden",
                footerPages: "hidden",
                footerPagesLink: "hidden",
                badge: "hidden",
                developmentModeNotice: "hidden",
                formFieldAction: "text-[#a48c7f] hover:text-[#FF8C42] text-xs",
                identityPreviewEditButton:
                  "text-[#FF8C42] hover:text-[#FFB68D]",
                formResendCodeLink: "text-[#FF8C42] hover:text-[#FFB68D]",
                otpCodeFieldInput:
                  "bg-[#14161a] border-[rgba(255,255,255,0.06)] text-[#f2dfd5] rounded-lg",
                alert:
                  "bg-red-500/10 border-red-500/20 text-red-400 rounded-xl",
                alertText: "text-red-400 text-sm",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
          />

          {/* Footer link */}
          <p className="text-center text-sm text-[#564338]">
            Don&apos;t have an account?{" "}
            <a
              href="/sign-up"
              className="font-medium text-[#FF8C42] hover:text-[#FFB68D] transition-colors"
            >
              Sign up
            </a>
          </p>

          {/* Free tier notice */}
          <p className="text-center text-xs text-[white]">
            No subscription required. Free forever for personal use.
          </p>
        </div>
      </div>

      {/* Right — Decorative panel */}
      <AuthDecorativePanel
        headline="Save everything worth revisiting"
        subtext="YouTube videos, LinkedIn posts, GitHub repos — all in one place. Never lose a bookmark again."
      />
    </div>
  );
}
