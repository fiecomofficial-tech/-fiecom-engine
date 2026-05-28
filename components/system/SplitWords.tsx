"use client";

import { motion } from "framer-motion";
import { easeOutExpo } from "@/lib/easings";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  /** When true, reveal on mount; when false, reveal on viewport entry. */
  immediate?: boolean;
}

/**
 * Word-by-word reveal. Each word slides up from below a clip mask.
 * Used for headline reveals across the platform.
 */
export function SplitWords({
  text,
  className,
  delay = 0,
  stagger = 0.045,
  once = true,
  immediate = false
}: Props) {
  const words = text.split(" ");
  const initial = { y: "120%", opacity: 0 };
  const animate = { y: "0%", opacity: 1 };

  return (
    <span className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline pb-[0.12em]">
          <motion.span
            className="inline-block will-change-transform"
            initial={initial}
            {...(immediate
              ? { animate, transition: { duration: 1.0, delay: delay + i * stagger, ease: easeOutExpo } }
              : {
                  whileInView: animate,
                  viewport: { once, amount: 0.4 },
                  transition: { duration: 1.0, delay: delay + i * stagger, ease: easeOutExpo }
                })}
          >
            {word}
            {i < words.length - 1 && " "}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
