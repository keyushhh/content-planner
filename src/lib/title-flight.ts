/** Animates the row title into the detail pane's title on open. */

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
    // Left/top of the ROW title, then transformed to the pane's. Animating
    // transform rather than position keeps it on the compositor.
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

  // Scale carries the size change: animating font-size would relayout the text
  // on every frame, and the whole point is that this costs nothing.
  const scale = toSize / fromSize;
  const dx = end.left - start.left;
  // Optical, not geometric: matching the text BASELINES is what stops the words
  // appearing to jump at the hand-off. Cap heights sit at roughly 0.72em.
  const dy = end.top - start.top + (end.height - start.height * scale) * 0.5;

  const animation = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 0.85 },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: 1,
        offset: 0.82,
      },
      // Fades out at the end rather than stopping dead: the real title is
      // already underneath by then, so the last frames are a cross-dissolve.
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
    ],
    { duration: DURATION, easing: EASE, fill: "forwards" },
  );

  const cleanup = () => ghost.remove();
  animation.addEventListener("finish", cleanup);
  animation.addEventListener("cancel", cleanup);
  // Backstop: if the tab is hidden mid-flight the events may never fire.
  setTimeout(cleanup, DURATION + 400);
}

/**
 * Waits for the pane's title to exist, then flies to it. The pane mounts a
 * frame or two after selection and its layout settles after that, so the target
 * cannot be measured synchronously. Polls a few frames and gives up quietly.
 */
export function flyTitleWhenReady(from: HTMLElement | null, toSelector: string, tries = 8) {
  if (!from) return;
  // The row is about to be covered by the pane, so its rect is captured NOW and
  // the clone is built from a detached copy rather than from the live node.
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
