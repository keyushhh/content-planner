
const DURATION = 380;
const EASE = "cubic-bezier(0.2,0,0,1)";

export function flyTitle(from: HTMLElement | null, to: HTMLElement | null) {
  if (!from || !to) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof document.body.animate !== "function") return;

  const start = from.getBoundingClientRect();
  const end = to.getBoundingClientRect();
  if (start.width === 0 || end.width === 0) return;

  const fromStyle = getComputedStyle(from);
  const toStyle = getComputedStyle(to);
  const fromSize = parseFloat(fromStyle.fontSize) || 13.5;
  const toSize = parseFloat(toStyle.fontSize) || 30;

  const text = (from.textContent ?? "").trim();
  if (!text) return;

  const ghost = document.createElement("div");
  ghost.textContent = text;
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${start.left}px`,
    top: `${start.top}px`,
    margin: "0",
    padding: "0",
    maxWidth: `${Math.max(start.width, end.width)}px`,
    font: `${fromStyle.fontWeight} ${fromSize}px ${fromStyle.fontFamily}`,
    letterSpacing: fromStyle.letterSpacing,
    lineHeight: `${start.height}px`,
    color: toStyle.color,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    pointerEvents: "none",
    zIndex: "200",
    transformOrigin: "left top",
    willChange: "transform, opacity",
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(ghost);

  const scale = toSize / fromSize;
  const dx = end.left - start.left;
  const dy = end.top - start.top + (end.height - start.height * scale) * 0.5;

  const animation = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 0.85 },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: 1,
        offset: 0.82,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
    ],
    { duration: DURATION, easing: EASE, fill: "forwards" },
  );

  const cleanup = () => ghost.remove();
  animation.addEventListener("finish", cleanup);
  animation.addEventListener("cancel", cleanup);
  setTimeout(cleanup, DURATION + 400);
}

export function flyTitleWhenReady(from: HTMLElement | null, toSelector: string, tries = 8) {
  if (!from) return;
  const snapshot = from.cloneNode(true) as HTMLElement;
  const rect = from.getBoundingClientRect();
  const style = getComputedStyle(from);
  Object.assign(snapshot.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    font: style.font,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    letterSpacing: style.letterSpacing,
    visibility: "hidden",
    pointerEvents: "none",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(snapshot);

  let attempts = 0;
  const tick = () => {
    const to = document.querySelector<HTMLElement>(toSelector);
    if (to && to.getBoundingClientRect().width > 0) {
      flyTitle(snapshot, to);
      snapshot.remove();
      return;
    }
    if (++attempts >= tries) {
      snapshot.remove();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
