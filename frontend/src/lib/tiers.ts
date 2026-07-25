import type { CSSProperties } from "react";

export type Tier = {
  name: string;
  flavor: string;
  sigil: string;
  weight: number;
  blurb: string;
  /** tuned for the frosted-light trophy chip in ClaimCard */
  accentLight: string;
  glowLight: string;
  /** tuned for the full-screen dark stage in WishReveal */
  accentDark: string;
  glowDark: string;
};

// Cosmetic-only, no monetary value — merkle-themed, all original artwork/copy.
export const TIERS: Tier[] = [
  {
    name: "Common",
    flavor: "Leaf Node",
    sigil: "◇",
    weight: 55,
    blurb: "A single hashed leaf at the edge of the tree. Quietly essential.",
    accentLight: "oklch(0.62 0.09 250)",
    glowLight: "oklch(0.72 0.11 250)",
    accentDark: "oklch(0.7 0.03 250)",
    glowDark: "oklch(0.75 0.05 250)",
  },
  {
    name: "Rare",
    flavor: "Sibling Hash",
    sigil: "◈",
    weight: 28,
    blurb: "Two hashes folded into one — a step closer to the root.",
    accentLight: "oklch(0.58 0.16 250)",
    glowLight: "oklch(0.66 0.17 255)",
    accentDark: "oklch(0.62 0.16 250)",
    glowDark: "oklch(0.68 0.17 255)",
  },
  {
    name: "Epic",
    flavor: "Merkle Root",
    sigil: "❖",
    weight: 13,
    blurb: "The commitment that anchors the entire set in a single hash.",
    accentLight: "oklch(0.55 0.2 305)",
    glowLight: "oklch(0.63 0.21 305)",
    accentDark: "oklch(0.58 0.2 305)",
    glowDark: "oklch(0.66 0.21 305)",
  },
  {
    name: "Legendary",
    flavor: "Genesis Preimage",
    sigil: "✦",
    weight: 4,
    blurb: "The original input no one else will ever draw. Soft pity guarantees it by pull 90.",
    accentLight: "oklch(0.68 0.14 78)",
    glowLight: "oklch(0.78 0.14 82)",
    accentDark: "oklch(0.76 0.15 85)",
    glowDark: "oklch(0.82 0.16 88)",
  },
];

// Weighted pick ignoring pity — used only by the preview strip so demoing
// visual states never perturbs the real gacha pity counters.
export function rollTier(): number {
  const total = TIERS.reduce((sum, t) => sum + t.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < TIERS.length; i++) {
    r -= TIERS[i].weight;
    if (r < 0) return i;
  }
  return 0;
}

const GOLD = "oklch(0.72 0.11 80 / 0.6)";

export function cornerBracketStyle(pos: "tl" | "tr" | "bl" | "br"): CSSProperties {
  const base: CSSProperties = { position: "absolute", width: 15, height: 15, pointerEvents: "none" };
  switch (pos) {
    case "tl":
      return { ...base, top: 9, left: 9, borderTop: `1.5px solid ${GOLD}`, borderLeft: `1.5px solid ${GOLD}`, borderTopLeftRadius: 6 };
    case "tr":
      return { ...base, top: 9, right: 9, borderTop: `1.5px solid ${GOLD}`, borderRight: `1.5px solid ${GOLD}`, borderTopRightRadius: 6 };
    case "bl":
      return { ...base, bottom: 9, left: 9, borderBottom: `1.5px solid ${GOLD}`, borderLeft: `1.5px solid ${GOLD}`, borderBottomLeftRadius: 6 };
    case "br":
      return { ...base, bottom: 9, right: 9, borderBottom: `1.5px solid ${GOLD}`, borderRight: `1.5px solid ${GOLD}`, borderBottomRightRadius: 6 };
  }
}
