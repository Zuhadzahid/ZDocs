import { Clock, FileText, Star, Users } from "lucide-react";
import { listDocuments, dashboardCounts, PAGE_SIZE, type DashboardView } from "@/lib/documents";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./AppSidebar";
import { DocumentCard } from "./DocumentCard";
import { UploadDropzone } from "./UploadDropzone";

const META: Record<DashboardView, { title: string; empty: string; icon: typeof FileText }> = {
  mine: { title: "My documents", empty: "You have not created any documents yet. Start one from the sidebar or import a file.", icon: FileText },
  shared: { title: "Shared with me", empty: "Nothing has been shared with you yet. Ask a teammate to share a document.", icon: Users },
  recent: { title: "Recent", empty: "Documents you open will show up here.", icon: Clock },
  starred: { title: "Starred", empty: "Star a document to keep it close at hand.", icon: Star },
};

export async function Dashboard({
  user,
  view,
}: {
  user: { id: string; name: string; email: string; color: string };
  view: DashboardView;
}) {
  const [docs, counts] = await Promise.all([listDocuments(user.id, view), dashboardCounts(user.id)]);
  const meta = META[view];
  const Icon = meta.icon;

  return (
    <SidebarProvider>
      <AppSidebar user={user} active={view} counts={counts} />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <Icon className="size-4 text-brand" />
          <h1 className="text-sm font-semibold">{meta.title}</h1>
          <span className="text-xs text-muted-foreground">{docs.length}</span>
        </header>

        <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6">
          {view === "mine" && <UploadDropzone />}

          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">{meta.empty}</p>
            </div>
          ) : (
            <>
              <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {docs.map((d) => (
                  <DocumentCard key={d.id} doc={d} showOwner={d.role !== "owner"} />
                ))}
              </div>
              {docs.length >= PAGE_SIZE && (
                <p className="text-center text-xs text-muted-foreground">Showing the {PAGE_SIZE} most recent documents.</p>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
