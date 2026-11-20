import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GREMORA AI - Online Video Editor",
  description: "Edit videos, add music, text, filters and export in 1 click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
