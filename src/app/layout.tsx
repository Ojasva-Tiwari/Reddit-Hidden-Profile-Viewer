import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/theme";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

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
  title: "Reddit Hidden Profile Viewer — Forensic Archive",
  description: "High-density historical Reddit profile exploration, content recovery status, and evidence-backed AI profiling.",
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-on-background min-h-screen flex flex-col antialiased`}>
        <ThemeProvider>
          <TopNavBar />
          <div className="flex-1 pt-12 flex flex-col">
            {children}
          </div>
          <GlobalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
