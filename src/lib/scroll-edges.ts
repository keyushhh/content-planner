"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** How much of the edge the fade covers. */
const FADE = 14;

/**
 * Fades a scroll container's edge only where content is actually hidden, so a
 * list that fits its box keeps hard edges and never looks clipped.
 *
 * Returns a [ref, style] tuple: a callback ref so measuring re-runs when the node
 * changes, and a tuple so no property named `ref` is read during render.
 */
export function useScrollEdges<T extends HTMLElement = HTMLDivElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    if (!node) return;

    const measure = () => {
      const top = node.scrollTop > 1;
      const bottom = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      // Compared first: scroll fires per frame and most frames change nothing.
      setEdges((prev) =>
        prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
      );
    };

    measure();
    node.addEventListener("scroll", measure, { passive: true });
    // Content and box both change size without a scroll event.
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);

    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [node]);

  const mask = `linear-gradient(to bottom, transparent 0px, black ${
    edges.top ? FADE : 0
  }px, black calc(100% - ${edges.bottom ? FADE : 0}px), transparent 100%)`;

  return [setNode, { maskImage: mask, WebkitMaskImage: mask } as CSSProperties] as const;
}
