export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeOutQuart = [0.25, 1, 0.5, 1] as const;
export const easeInOutCirc = [0.85, 0, 0.15, 1] as const;
export const easeEmphatic = [0.2, 0.8, 0.2, 1] as const;
export const easeAnticipate = [0.6, -0.05, 0.01, 0.99] as const;

export const transitions = {
  display: { duration: 1.4, ease: easeOutExpo },
  rise: { duration: 0.9, ease: easeOutExpo },
  ease: { duration: 0.6, ease: easeOutExpo },
  snap: { duration: 0.35, ease: easeOutQuart }
} as const;
