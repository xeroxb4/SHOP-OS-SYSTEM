import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shop OS System",
  description: "Distributor & wholesale shop operating system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
