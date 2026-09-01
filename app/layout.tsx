import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Room Planner",
  description: "Draw measured rooms, place openings and furniture, and keep your floor plan locally in the browser.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ "--font-ui": "Inter, Avenir Next, Segoe UI, sans-serif" } as React.CSSProperties}>{children}</body>
    </html>
  );
}
