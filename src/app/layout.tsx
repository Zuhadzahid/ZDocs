import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { axiforma } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ZDocs", template: "%s · ZDocs" },
  description: "ZDocs: a small docs app for notes, drafts and quick sharing. Write, import, share with view or edit access, keep history, export.",
  icons: { icon: "/logo-mark.png", apple: "/logo-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${axiforma.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
