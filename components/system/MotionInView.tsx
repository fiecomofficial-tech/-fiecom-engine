"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { easeOutExpo } from "@/lib/easings";

interface Props extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
}

export function MotionInView({
  children,
  delay = 0,
  y = 24,
  duration = 1.0,
  once = true,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "-10% 0px -10% 0px" }}
      transition={{ duration, delay, ease: easeOutExpo }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
