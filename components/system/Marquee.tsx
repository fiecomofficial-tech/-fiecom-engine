"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  /** Animation duration in seconds. Lower is faster. */
  speed?: number;
}

/**
 * Two duplicated tracks scrolling continuously. Pure CSS — no JS work after mount.
 * Wrap each item in a fragment with consistent spacing.
 */
export function Marquee({ children, className, reverse = false, speed = 60 }: Props) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div
        className="flex w-max"
        style={{
          animation: `${reverse ? "marquee-r" : "marquee-l"} ${speed}s linear infinite`
        }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes marquee-l { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @keyframes marquee-r { from { transform: translate3d(-50%,0,0); } to { transform: translate3d(0,0,0); } }
      `}</style>
    </div>
  );
}
