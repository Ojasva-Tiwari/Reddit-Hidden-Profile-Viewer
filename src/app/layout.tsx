import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/theme";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { DecorativeMascot } from "@/components/layout/DecorativeMascot";

import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reddit Profile Viewer",
  description: "Look up a Reddit profile with its posts, comments, history, and evidence-backed insights.",
  icons: {
    icon: "/mascot.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/* Anti-FOUC script for theme persistence */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('rhpv-theme');
                if (savedTheme) {
                  document.documentElement.className = savedTheme;
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.className = 'dark';
                } else {
                  document.documentElement.className = 'light';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-on-background min-h-screen flex flex-col antialiased transition-colors relative`}>
        <QueryProvider>
          <ThemeProvider>
            <TopNavBar />
            {/* Shared Decorative Mascot across all pages */}
            <DecorativeMascot />
            <div className="flex-1 flex flex-col relative z-10">
              {children}
            </div>
            <GlobalFooter />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
