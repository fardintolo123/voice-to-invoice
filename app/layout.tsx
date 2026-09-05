import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlainLaunch Quotes",
  description: "Voice-to-invoice and quote workflow for small service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
