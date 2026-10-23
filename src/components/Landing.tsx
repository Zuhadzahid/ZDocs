import Link from "next/link";
import { Download, FileText, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { FeatureTimeline, type TimelineStep } from "./FeatureTimeline";
import { Wordmark } from "./Logo";

const STEPS: TimelineStep[] = [
  {
    id: "write",
    label: "01",
    title: "Write it down",
    text: "Open a blank page and type. Headings, lists, bold, italic, underline and quotes. It saves itself while you write.",
    icon: "pen",
  },
  {
    id: "import",
    label: "02",
    title: "Bring in your files",
    text: "Drop a .txt, .md or .docx on the dashboard and it becomes a live document you can keep editing. Structure survives.",
    icon: "upload",
  },
  {
    id: "share",
    label: "03",
    title: "Share with the right people",
    text: "Add someone by email as a viewer or an editor. Viewers read, editors write, only you can manage or delete.",
    icon: "share",
  },
  {
    id: "link",
    label: "04",
    title: "Or just send a link",
    text: "Create a link that grants view or edit access to anyone who opens it. Turn it off any time; people already in keep their access.",
    icon: "link",
  },
  {
    id: "presence",
    label: "05",
    title: "See who is here",
    text: "Avatars show who has the document open right now, so you are never surprised by someone else's edit.",
    icon: "users",
  },
  {
    id: "history",
    label: "06",
    title: "Go back in time",
    text: "Every change is kept. Preview any earlier version and restore it. The restore is recorded too, so nothing is ever lost.",
    icon: "clock",
  },
  {
    id: "export",
    label: "07",
    title: "Take it with you",
    text: "Download any document as Markdown or PDF. Your writing is yours, not locked in the app.",
    icon: "download",
  },
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
            Create account
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-10 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16 lg:pt-14">
        <div className="stagger">
          <Badge variant="secondary" className="mb-5 rounded-full bg-brand-soft px-3 py-1 text-brand-hover">
            A small docs app for notes, drafts and quick sharing
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
            Write it down. <span className="text-gradient-brand">Share it in seconds.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            ZDocs is a lightweight place to keep documents: start from a blank page or a file you already have,
            format it properly, and hand it to someone with a view or edit link. No workspace setup, no clutter.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {["Autosave", "Import .txt .md .docx", "View / edit roles", "Share links", "Version history", "Markdown & PDF export"].map((t) => (
              <li key={t} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            Demo project. Try it with <span className="font-medium text-foreground">alice@ajaia.test</span> and password{" "}
            <span className="font-medium text-foreground">demo1234</span>, or create your own account.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthCard defaultTab={defaultTab} googleEnabled={googleEnabled} next={next} initialError={initialError} />
        </div>
      </section>

      {/* Feature timeline */}
      <section className="border-t border-border bg-gradient-to-b from-background to-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:py-16">
          <FeatureTimeline steps={STEPS} defaultIndex={0} aria-label="What you can do with ZDocs" />
          <p className="mt-4 px-1 text-xs text-muted-foreground">Drag, flick or use the arrow keys to move through the features.</p>
        </div>
      </section>

      {/* Who it is for */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
          {[
            { icon: FileText, title: "For your own notes", text: "Meeting notes, drafts, checklists. One place, searchable by title, always saved." },
            { icon: Share2, title: "For a small team", text: "Share a doc with two people and a link with everyone else. Roles keep it tidy." },
            { icon: Download, title: "For handing off", text: "Export to Markdown for the repo or PDF for the inbox, straight from the editor." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="lift rounded-xl border border-border bg-background p-5">
              <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
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
          <span>ZDocs · a personal docs demo project</span>
          <span>Next.js · Tiptap · Prisma · Postgres · shadcn/ui</span>
        </div>
      </footer>
    </main>
  );
}
