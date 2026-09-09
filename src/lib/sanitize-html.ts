import DOMPurify from "isomorphic-dompurify";

// Matches what the Tiptap StarterKit rich text editor can produce (see
// src/components/ui/rich-text-editor.tsx). Anything else is stripped so
// stored/rendered descriptions can never carry scripts or event handlers.
const RICH_TEXT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "code",
  "pre",
  "hr",
];

const RICH_TEXT_ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
  });
}

/**
 * Strips every tag and entity-escapes what is left. Use it for values that are
 * authored and rendered as plain text (e.g. FAQ questions and answers), so a
 * pasted `<script>` is stored as inert text rather than markup.
 */
export function sanitizePlainText(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
