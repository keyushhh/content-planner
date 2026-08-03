// A textarea exposes no caret geometry, so measure a mirror div wearing the same metrics.
const MIRRORED: (keyof CSSStyleDeclaration)[] = [
  "boxSizing",
  "fontFamily",
  "fontSize",
  "fontStretch",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "textIndent",
  "textTransform",
  "wordSpacing",
];

export function caretRect(el: HTMLTextAreaElement): DOMRect | null {
  if (typeof document === "undefined") return null;

  const caret = el.selectionStart ?? 0;
  const computed = window.getComputedStyle(el);
  const mirror = document.createElement("div");

  for (const key of MIRRORED) {
    // @ts-expect-error indexing CSSStyleDeclaration by a narrowed key union
    mirror.style[key] = computed[key];
  }

  mirror.style.position = "absolute";
  mirror.style.top = "0";
  mirror.style.left = "0";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.style.width = `${el.clientWidth}px`;
  mirror.textContent = el.value.slice(0, caret);

  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const markerTop = marker.offsetTop;
  const markerLeft = marker.offsetLeft;
  const markerHeight = marker.offsetHeight || parseFloat(computed.lineHeight) || 16;
  document.body.removeChild(mirror);

  // The mirror is unscrolled, so subtract the textarea's scroll.
  const box = el.getBoundingClientRect();
  const x = box.left + markerLeft - el.scrollLeft;
  const y = box.top + markerTop - el.scrollTop;

  return new DOMRect(x, y, 1, markerHeight);
}
