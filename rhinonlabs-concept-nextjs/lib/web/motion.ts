import type { Transition } from "motion/react";

// Easing curves and springs shared across sections (taken from the original's appear configs).
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_CURTAIN = [0.68, 0, 0, 1] as const;

export const spring = (delay = 0): Transition => ({ type: "spring", damping: 27, mass: 0.3, stiffness: 219, delay });
