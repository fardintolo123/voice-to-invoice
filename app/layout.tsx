import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4 Elements Document Builder",
  description: "Voice-to-quote and invoice workflow for 4 Elements Painting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
