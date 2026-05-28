"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends Omit<ComponentPropsWithoutRef<"button">, "ref"> {
  /** Pull strength in pixels at full distance. */
  strength?: number;
  asLink?: { href: string };
}

/**
 * A button that subtly pulls toward the cursor. Strength stays low to keep
 * the feel premium rather than gimmicky.
 */
export function MagneticButton({
  children,
  className,
  strength = 14,
  asLink,
  ...props
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 22, mass: 0.4 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / r.width;
    const dy = (e.clientY - cy) / r.height;
    x.set(dx * strength);
    y.set(dy * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors",
        "bg-[var(--color-ink)] text-[var(--color-mist-2)] hover:bg-[var(--color-ink-2)]",
        className
      )}
    >
      {children}
    </motion.div>
  );

  if (asLink) {
    return (
      <a href={asLink.href} className="inline-block">
        {inner}
      </a>
    );
  }
  return (
    <button {...props} className="inline-block">
      {inner}
    </button>
  );
}
