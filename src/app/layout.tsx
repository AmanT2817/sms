import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Model School — School Portal",
  description: "Secure school portal for staff and faculty. Sign in to access your dashboard.",
  keywords: ["school", "portal", "Model School", "education", "dashboard"],
  authors: [{ name: "Model School" }],
};

// Critical for mobile: tells the browser to render at the device's actual
// width instead of a desktop width and zooming out. Without this, the
// dashboard renders as a tiny desktop layout on phones (cards in a single
// truncated row, text overlapping, horizontal scroll).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // allow zoom for accessibility, but prevent layout-breaking zoom
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
