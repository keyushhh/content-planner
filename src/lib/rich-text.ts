const ALLOWED = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "A",
  "BLOCKQUOTE",
  "OL",
  "UL",
  "LI",
]);

const UNWRAP = new Set(["DIV", "SPAN", "FONT", "SECTION", "ARTICLE"]);

export function sanitizeRichText(html: string): string {
  if (typeof document === "undefined") return "";
  const host = document.createElement("div");
  host.innerHTML = html;
  clean(host);
  return host.innerHTML;
}

function clean(node: Element) {
  for (const child of Array.from(node.children)) {
    clean(child);

    if (UNWRAP.has(child.tagName)) {
      child.replaceWith(...Array.from(child.childNodes));
      continue;
    }

    if (!ALLOWED.has(child.tagName)) {
      child.replaceWith(document.createTextNode(child.textContent ?? ""));
      continue;
    }

    for (const attr of Array.from(child.attributes)) {
      const keep =
        child.tagName === "A" && attr.name === "href" && safeHref(attr.value);
      if (!keep) child.removeAttribute(attr.name);
    }

    if (child.tagName === "A") {
      if (!child.getAttribute("href")) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      child.setAttribute("target", "_blank");
      child.setAttribute("rel", "noopener noreferrer");
    }
  }
}

function safeHref(value: string) {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:")
  );
}

export function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function richTextToPlain(html: string) {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const host = document.createElement("div");
  host.innerHTML = html;
  return (host.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function isRichTextEmpty(html: string) {
  return richTextToPlain(html).length === 0;
}
