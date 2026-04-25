import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Savely",
    template: "%s | Savely",
  },
  description:
    "Save and organize content from YouTube, LinkedIn, GitHub, and more — all in one place.",
  keywords: [
    "savely",
    "bookmark manager",
    "content aggregator",
    "saved posts",
    "youtube",
    "linkedin",
    "github",
  ],
  authors: [{ name: "Savely" }],
  creator: "Savely",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "Savely",
    description:
      "Save and organize content from YouTube, LinkedIn, GitHub, and more — all in one place.",
    siteName: "Savely",
    images: [{ url: "/logo.svg", width: 512, height: 512, alt: "Savely Logo" }],
  },
  twitter: {
    card: "summary",
    title: "Savely",
    description:
      "Save and organize content from YouTube, LinkedIn, GitHub, and more — all in one place.",
    images: ["/logo.svg"],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: "#FF8C42",
                colorBackground: "#281d18",
                colorText: "#f2dfd5",
                colorInputBackground: "#1b110c",
                colorInputText: "#f2dfd5",
              },
            }}
          >
            <TRPCReactProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </TRPCReactProvider>
          </ClerkProvider>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
