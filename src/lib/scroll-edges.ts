"use client";

import { useEffect, useState, type CSSProperties } from "react";

const FADE = 14;

export function useScrollEdges<T extends HTMLElement = HTMLDivElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    if (!node) return;

    const measure = () => {
      const top = node.scrollTop > 1;
      const bottom = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      setEdges((prev) =>
        prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
      );
    };

    measure();
    node.addEventListener("scroll", measure, { passive: true });
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
