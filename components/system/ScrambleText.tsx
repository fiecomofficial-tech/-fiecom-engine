"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01.";

interface Props {
  text: string;
  className?: string;
  duration?: number;
  trigger?: number;
}

/** Scramble text that resolves to the target. Used on hover/swap moments. */
export function ScrambleText({ text, className, duration = 700, trigger = 0 }: Props) {
  const [out, setOut] = useState(text);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const n = text.length;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      let acc = "";
      for (let i = 0; i < n; i++) {
        const reveal = t * n;
        if (i < reveal) acc += text[i];
        else acc += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut(acc);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [text, trigger, duration]);

  return <span className={className}>{out}</span>;
}
