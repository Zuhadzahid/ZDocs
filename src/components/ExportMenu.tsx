"use client";

import { Download, FileText, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Download the document as Markdown or PDF. Plain anchors so the browser handles the file. */
export function ExportMenu({ documentId }: { documentId: string }) {
  const href = (format: "markdown" | "pdf") => `/api/documents/${documentId}/export?format=${format}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="pressable gap-1.5 text-muted-foreground" aria-label="Export" />}
      >
        <Download className="size-4" />
        <span className="hidden sm:inline">Export</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem render={<a href={href("markdown")} download />}>
          <FileText className="size-4" /> Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href={href("pdf")} download />}>
          <FileType className="size-4" /> PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
