import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic AI Pokedex",
  description: "A source-aware Pokemon assistant with explainable routing."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
