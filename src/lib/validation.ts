import { z } from "zod";

export const MAX_TITLE_LENGTH = 200;
/** Hard cap on serialized document JSON (1 MB). */
export const MAX_CONTENT_BYTES = 1_000_000;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`);

/** Minimal shape check for a Tiptap/ProseMirror document. */
export const contentSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  })
  .passthrough()
  .refine((doc) => JSON.stringify(doc).length <= MAX_CONTENT_BYTES, {
    message: "Document is too large",
  });

export const createDocumentSchema = z.object({
  title: titleSchema.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    excerpt: z.string().max(300).optional(),
    /** ISO timestamp of the version the client last loaded; used to detect conflicts. */
    baseUpdatedAt: z.string().datetime().optional(),
  })
  .refine((d) => d.title !== undefined || d.content !== undefined, {
    message: "Nothing to update",
  });

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["VIEWER", "EDITOR"]),
});

export function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input";
}

// ---------- Authentication ----------

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(80, "Name is too long"),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});
