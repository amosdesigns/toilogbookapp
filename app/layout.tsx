import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Town of Islip Marina Guard Logbook",
  description:
    "Guard logbook application for managing marina security operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased composition-pattern`}
        >
          {/* Full-screen background image */}
          <div
            className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/bg.png')",
              zIndex: -1,
            }}
          />

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Mobile: full screen, Large screens: centered with max width */}
            <div className="min-h-screen lg:flex lg:items-center lg:justify-center lg:p-8">
              <div className="w-full 2xl:max-w-[1200px] 2xl:shadow-2xl 2xl:rounded-2xl 2xl:overflow-hidden 2xl:bg-background/95 2xl:backdrop-blur-sm">
                {children}
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
