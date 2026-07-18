import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus GPT — The AI-native workspace for developers",
  description:
    "Video, screen share, real-time code, and an AI software engineer in one room. No account needed — create a link and start building.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
