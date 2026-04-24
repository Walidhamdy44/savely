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
  title: "Unified Content Hub",
  description: "Your saved content, all in one place",
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
