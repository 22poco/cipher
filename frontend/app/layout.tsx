import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import "./globals.css";

// Font Awesome injects its own <style> at runtime by default; we ship the CSS
// ourselves (imported above) so icons don't flash at their unstyled size.
config.autoAddCss = false;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cipher — AP Cybersecurity Practice",
  description:
    "Practice-first AP Cybersecurity platform: missions, simulations, and teacher-graded evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full bg-page text-ink">{children}</body>
    </html>
  );
}
