import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { JSONContent } from "@tiptap/core";

/**
 * Renders the editor's JSON straight to PDF with @react-pdf/renderer, so no
 * headless browser is needed on the server. Supports everything the editor
 * schema can produce: headings 1-3, paragraphs, bullet/ordered lists,
 * blockquotes, hard breaks and the bold/italic/underline/strike marks.
 */

const styles = StyleSheet.create({
  page: { paddingTop: 56, paddingBottom: 64, paddingHorizontal: 60, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.5, color: "#1a2340" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 14, color: "#0b1633" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  h2: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 5 },
  h3: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 7 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  marker: { width: 18 },
  listBody: { flex: 1 },
  quote: { borderLeftWidth: 2, borderLeftColor: "#c7ccd6", paddingLeft: 10, color: "#4b5563", marginBottom: 7 },
  footer: { position: "absolute", bottom: 32, left: 60, right: 60, fontSize: 9, color: "#9aa0a6", textAlign: "right" },
});

type Mark = { type: string };

function fontFor(marks: Mark[] = []): string {
  const bold = marks.some((m) => m.type === "bold");
  const italic = marks.some((m) => m.type === "italic");
  if (bold && italic) return "Helvetica-BoldOblique";
  if (bold) return "Helvetica-Bold";
  if (italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function decorationFor(marks: Mark[] = []): "underline" | "line-through" | "underline line-through" | undefined {
  const u = marks.some((m) => m.type === "underline");
  const s = marks.some((m) => m.type === "strike");
  if (u && s) return "underline line-through";
  if (u) return "underline";
  if (s) return "line-through";
  return undefined;
}

function Inline({ nodes }: { nodes: JSONContent[] | undefined }) {
  if (!nodes || nodes.length === 0) return <Text> </Text>;
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === "hardBreak") return <Text key={i}>{"\n"}</Text>;
        if (n.type !== "text") return null;
        return (
          <Text key={i} style={{ fontFamily: fontFor(n.marks as Mark[]), textDecoration: decorationFor(n.marks as Mark[]) }}>
            {n.text}
          </Text>
        );
      })}
    </>
  );
}

function Block({ node, depth = 0 }: { node: JSONContent; depth?: number }) {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const style = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      return (
        <Text style={style}>
          <Inline nodes={node.content} />
        </Text>
      );
    }
    case "paragraph":
      return (
        <Text style={styles.p}>
          <Inline nodes={node.content} />
        </Text>
      );
    case "blockquote":
      return (
        <View style={styles.quote}>
          {node.content?.map((child, i) => <Block key={i} node={child} depth={depth} />)}
        </View>
      );
    case "bulletList":
    case "orderedList": {
      const start = (node.attrs?.start as number) ?? 1;
      return (
        <View style={{ marginBottom: 6, marginLeft: depth * 14 }}>
          {node.content?.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.marker}>{node.type === "bulletList" ? "\u2022" : `${start + i}.`}</Text>
              <View style={styles.listBody}>
                {item.content?.map((child, j) => <Block key={j} node={child} depth={depth + 1} />)}
              </View>
            </View>
          ))}
        </View>
      );
    }
    default:
      return null;
  }
}

export function PdfDocument({ title, content }: { title: string; content: JSONContent }) {
  return (
    <Document title={title} producer="ZDocs" creator="ZDocs">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {content.content?.map((node, i) => <Block key={i} node={node} />)}
        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${title}  ·  ${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function documentToPdf(title: string, content: JSONContent): Promise<Buffer> {
  return renderToBuffer(<PdfDocument title={title} content={content} />);
}
