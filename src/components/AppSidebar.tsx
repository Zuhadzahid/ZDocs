"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, FileText, LogOut, Plus, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/app/actions/auth";
import type { DashboardView } from "@/lib/documents";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

const NAV: { view: DashboardView; label: string; icon: typeof FileText }[] = [
  { view: "mine", label: "My documents", icon: FileText },
  { view: "shared", label: "Shared with me", icon: Users },
  { view: "recent", label: "Recent", icon: Clock },
  { view: "starred", label: "Starred", icon: Star },
];

export function AppSidebar({
  user,
  active,
  counts,
}: {
  user: { name: string; email: string; color: string };
  active: DashboardView;
  counts: { mine: number; shared: number; starred: number };
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createDocument() {
    setCreating(true);
    try {
      const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create document");
      toast.success("New document created");
      router.push(`/docs/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create document");
      setCreating(false);
    }
  }

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-7 px-3 pt-5 pb-2">
        <Link href="/" className="flex items-center gap-2 px-1 font-semibold text-navy">
          <Logo size={28} />
          <span className="text-[1.05rem]">ZDocs</span>
        </Link>
        <Button onClick={createDocument} disabled={creating} size="lg" className="pressable h-10 w-full justify-start gap-2 rounded-xl shadow-sm">
          <Plus className="size-4.5" />
          {creating ? "Creating..." : "New document"}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ view, label, icon: Icon }) => {
                const count = view === "mine" ? counts.mine : view === "shared" ? counts.shared : view === "starred" ? counts.starred : null;
                return (
                  <SidebarMenuItem key={view}>
                    <SidebarMenuButton
                      isActive={active === view}
                      className="h-9 rounded-lg px-3 data-[active=true]:font-semibold"
                      render={<Link href={view === "mine" ? "/" : `/?view=${view}`} />}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    {count !== null && count > 0 && <SidebarMenuBadge className="text-muted-foreground">{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback style={{ background: user.color }} className="text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon-sm" className="pressable text-muted-foreground" title="Sign out" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
