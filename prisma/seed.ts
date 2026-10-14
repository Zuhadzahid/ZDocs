import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../src/lib/password";
import { markdownToHtml } from "../src/lib/import";
import { documentToExcerpt, htmlToDocument } from "../src/lib/tiptap-server";

const prisma = new PrismaClient();

// Stable ids so the README can reference them and reruns are idempotent.
// All three demo accounts share one password (documented in the README).
export const DEMO_PASSWORD = "demo1234";
const USERS = [
  { id: "user_alice", name: "Alice Chen", email: "alice@ajaia.test", color: "#2563eb" },
  { id: "user_bob", name: "Bob Martinez", email: "bob@ajaia.test", color: "#16a34a" },
  { id: "user_carol", name: "Carol Okafor", email: "carol@ajaia.test", color: "#d97706" },
];

const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
const h = (level: number, text: string) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});
const li = (text: string) => ({ type: "listItem", content: [p(text)] });

const roadmap = {
  type: "doc",
  content: [
    h(1, "Q4 Product Roadmap"),
    p("Shared planning document for the platform team. Edit freely; this is the source of truth."),
    h(2, "Themes"),
    { type: "bulletList", content: [li("Faster onboarding"), li("Shared workspaces"), li("Reliability")] },
    h(2, "Milestones"),
    {
      type: "orderedList",
      content: [li("Ship document sharing (October)"), li("Import from Word (November)"), li("Comments (December)")],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Owner: ", marks: [{ type: "bold" }] },
        { type: "text", text: "Alice. " },
        { type: "text", text: "Reviewers: ", marks: [{ type: "bold" }] },
        { type: "text", text: "Bob (edit), Carol (view).", marks: [{ type: "italic" }] },
      ],
    },
  ],
};

const onboarding = {
  type: "doc",
  content: [
    h(1, "New hire onboarding checklist"),
    { type: "bulletList", content: [li("Laptop and accounts"), li("Meet the team"), li("First PR by day 3")] },
    p("Private draft, not shared yet."),
  ],
};

const notes = {
  type: "doc",
  content: [
    h(1, "Weekly sync notes"),
    h(2, "Decisions"),
    { type: "bulletList", content: [li("Keep scope to three file types for import"), li("Last-write-wins is fine for v1")] },
    h(2, "Action items"),
    { type: "orderedList", content: [li("Bob: write architecture note"), li("Alice: record walkthrough")] },
  ],
};

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const u of USERS) {
    const data = { ...u, passwordHash, provider: "password" };
    await prisma.user.upsert({ where: { id: u.id }, update: data, create: data });
  }

  const docs = [
    { id: "doc_roadmap", title: "Q4 Product Roadmap", ownerId: "user_alice", content: roadmap,
      excerpt: "Shared planning document for the platform team. Edit freely; this is the source of truth." },
    { id: "doc_onboarding", title: "New hire onboarding checklist", ownerId: "user_alice", content: onboarding,
      excerpt: "Laptop and accounts. Meet the team. First PR by day 3." },
    { id: "doc_notes", title: "Weekly sync notes", ownerId: "user_bob", content: notes,
      excerpt: "Decisions: keep scope to three file types for import; last-write-wins is fine for v1." },
  ];
  for (const d of docs) {
    await prisma.document.upsert({ where: { id: d.id }, update: d, create: d });
  }

  const shares = [
    { documentId: "doc_roadmap", userId: "user_bob", role: "EDITOR" as const },
    { documentId: "doc_roadmap", userId: "user_carol", role: "VIEWER" as const },
    { documentId: "doc_notes", userId: "user_alice", role: "VIEWER" as const },
  ];
  for (const s of shares) {
    await prisma.documentShare.upsert({
      where: { documentId_userId: { documentId: s.documentId, userId: s.userId } },
      update: { role: s.role },
      create: s,
    });
  }

  // The project's own documentation, imported as real documents owned by Alice
  // and shared with Bob (edit) and Carol (view), so reviewers can exercise the
  // sharing model on substantial content. Re-running the seed refreshes them.
  const PROJECT_DOCS = [
    { id: "doc_readme", file: "README.md", title: "ZDocs · README" },
    { id: "doc_architecture", file: "ARCHITECTURE.md", title: "ZDocs · Architecture" },
    { id: "doc_ai_workflow", file: "AI_WORKFLOW.md", title: "ZDocs · AI Workflow" },
    { id: "doc_testing", file: "TESTING.md", title: "ZDocs · Testing" },
    { id: "doc_submission", file: "SUBMISSION.md", title: "ZDocs · Submission" },
    { id: "doc_walkthrough", file: "WALKTHROUGH_SCRIPT.md", title: "ZDocs · Walkthrough Script" },
  ];
  const root = join(__dirname, "..");
  for (const d of PROJECT_DOCS) {
    const markdown = readFileSync(join(root, d.file), "utf8");
    const content = htmlToDocument(markdownToHtml(markdown));
    const data = { title: d.title, ownerId: "user_alice", content, excerpt: documentToExcerpt(content) };
    await prisma.document.upsert({ where: { id: d.id }, update: data, create: { id: d.id, ...data } });
    for (const share of [
      { userId: "user_bob", role: "EDITOR" as const },
      { userId: "user_carol", role: "VIEWER" as const },
    ]) {
      await prisma.documentShare.upsert({
        where: { documentId_userId: { documentId: d.id, userId: share.userId } },
        update: { role: share.role },
        create: { documentId: d.id, ...share },
      });
    }
    await prisma.documentVersion.upsert({
      where: { id: `${d.id}_v0` },
      update: { content, title: d.title },
      create: { id: `${d.id}_v0`, documentId: d.id, content, title: d.title, authorId: "user_alice", reason: "import" },
    });
  }

  // Alice has starred the roadmap and recently opened both of her documents.
  await prisma.documentStar.upsert({
    where: { userId_documentId: { userId: "user_alice", documentId: "doc_roadmap" } },
    update: {},
    create: { userId: "user_alice", documentId: "doc_roadmap" },
  });
  for (const documentId of ["doc_roadmap", "doc_notes"]) {
    await prisma.documentView.upsert({
      where: { userId_documentId: { userId: "user_alice", documentId } },
      update: { viewedAt: new Date() },
      create: { userId: "user_alice", documentId },
    });
  }

  console.log(
    `Seeded ${USERS.length} users, ${docs.length + PROJECT_DOCS.length} documents (${PROJECT_DOCS.length} from project docs), ${shares.length + PROJECT_DOCS.length * 2} shares.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
