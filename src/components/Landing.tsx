import Link from "next/link";
import { FileText, Share2, Upload, ShieldCheck, Database, TestTube2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { Wordmark } from "./Logo";

const FEATURES = [
  { icon: FileText, title: "Write with structure", text: "Headings, lists, bold, italic and underline. Every change autosaves." },
  { icon: Upload, title: "Bring your files", text: "Drop a .txt, .md or .docx and keep editing it as a live document." },
  { icon: Share2, title: "Share with control", text: "Give teammates view or edit access and see who has what at a glance." },
];

const BUILT = [
  { icon: ShieldCheck, text: "Email + password and Google sign-in" },
  { icon: Database, text: "Postgres persistence with conflict detection" },
  { icon: TestTube2, text: "Unit-tested access logic and import pipeline" },
];

export function Landing({
  googleEnabled,
  defaultTab = "signin",
  next,
  initialError,
}: {
  googleEnabled: boolean;
  defaultTab?: "signin" | "signup";
  next?: string;
  initialError?: string;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="ZDocs home" className="flex items-center">
          <Wordmark height={30} />
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" className="pressable" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button className="pressable" nativeButton={false} render={<Link href="/signup" />}>
            Get started
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="stagger">
          <Badge variant="secondary" className="mb-5 rounded-full bg-brand-soft px-3 py-1 text-brand-hover">
            Product engineering demo · Full Stack Product Engineer · AJAIA
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
            Documents your team can <span className="text-gradient-brand">actually move with.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            ZDocs is a lightweight, Google-Docs-inspired editor: create, format, import and share documents in the
            browser. Built as a focused product slice for the Ajaia Full Stack Product Engineer assignment.
          </p>
          <ul className="mt-7 space-y-2.5">
            {BUILT.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground/80">
                <span className="flex size-7 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthCard defaultTab={defaultTab} googleEnabled={googleEnabled} next={next} initialError={initialError} />
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="stagger mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="lift rounded-xl border border-border bg-background p-5">
              <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
                <Icon className="size-4.5" />
              </span>
              <h2 className="font-semibold text-navy">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>ZDocs · Product engineering demo for Full Stack Product Engineer – AJAIA</span>
          <span>Next.js · Tiptap · Prisma · Postgres · shadcn/ui</span>
        </div>
      </footer>
    </main>
  );
}
