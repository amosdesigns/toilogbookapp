import type { Metadata } from "next";
import localFont from "next/font/local";
import {Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/StaticData/data";
const caveat = localFont({
  src:"../fonts/Caveat/Caveat-VariableFont_wght.ttf",
  variable: "--font-caveat",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE.TITLE,
  description: SITE.DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} ${caveat.variable}  antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
