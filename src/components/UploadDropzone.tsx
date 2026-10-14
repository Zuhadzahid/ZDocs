"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { MAX_UPLOAD_BYTES, SUPPORTED_ACCEPT, SUPPORTED_EXTENSIONS, detectKind } from "@/lib/import";

/**
 * Upload a .txt, .md or .docx file; the server converts it into a new
 * editable document and we navigate straight to it.
 */
export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!detectKind(file.name)) {
      toast.error(`Unsupported file type. Use ${SUPPORTED_EXTENSIONS.map((e) => "." + e).join(", ")}.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast.success(`Imported "${data.title}"`);
      router.push(`/docs/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
      setBusy(false);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Import a file as a new document"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 text-sm transition-[border-color,background-color] duration-200 ${
        dragging ? "border-brand bg-brand-soft" : "border-border bg-card hover:border-brand/60"
      } ${busy ? "opacity-60" : ""}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Upload className="size-4.5" />
      </span>
      <div className="min-w-0">
        <div className="font-medium text-navy">{busy ? "Importing..." : "Import a file as a new document"}</div>
        <div className="text-xs text-muted-foreground">
          Drag and drop or click. Supports .txt, .md and .docx up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB.
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
