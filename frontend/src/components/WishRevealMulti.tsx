import { useEffect, useState, type CSSProperties } from "react";
import { TIERS } from "@/lib/tiers";

const CARD_W = 90;
const CARD_H = 130;
const GAP = 12;

export function WishRevealMulti({ results, onClose }: { results: { tierIdx: number }[]; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 40);
    return () => clearTimeout(t);
  }, []);

  const bestIdx = results.reduce((a, r) => Math.max(a, r.tierIdx), 0);
  const bestTier = TIERS[bestIdx] ?? TIERS[0];

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    fontFamily: "'Geist Variable', system-ui, sans-serif",
    background: "radial-gradient(circle at 50% 55%, oklch(0.19 0.015 265), oklch(0.09 0.01 265))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    overflow: "hidden",
  };

  const titleStyle: CSSProperties = {
    fontFamily: "'Cinzel', serif",
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "oklch(0.9 0.04 90)",
    textShadow: "0 0 30px oklch(0.82 0.13 85 / 0.5)",
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(5, ${CARD_W}px)`,
    gridAutoRows: `${CARD_H}px`,
    gap: GAP,
    maxWidth: 520,
  };

  const closeStyle: CSSProperties = {
    height: 42,
    padding: "0 28px",
    font: "inherit",
    fontSize: 14,
    fontWeight: 500,
    color: "oklch(0.14 0 0)",
    background: "oklch(0.97 0 0)",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  };

  return (
    <div style={overlayStyle}>
      <div style={titleStyle}>10× Genesis Wish</div>

      <div style={gridStyle}>
        {results.map((r, i) => {
          const t = TIERS[r.tierIdx] ?? TIERS[0];
          const isBest = r.tierIdx === bestIdx;
          const cardWrap: CSSProperties = {
            position: "relative",
            width: CARD_W,
            height: CARD_H,
            perspective: 900,
          };
          const cardInner: CSSProperties = {
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
            transition: "transform 0.6s cubic-bezier(.2,.75,.2,1)",
            transitionDelay: `${i * 80}ms`,
          };
          const faceBase: CSSProperties = {
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          };
          const backStyle: CSSProperties = {
            ...faceBase,
            transform: "rotateY(180deg)",
            background: "linear-gradient(160deg, oklch(0.28 0.02 265), oklch(0.16 0.02 265))",
            border: "1px solid oklch(1 0 0 / 0.12)",
            color: "oklch(0.7 0 0)",
            boxShadow: "inset 0 0 30px oklch(0 0 0 / 0.4)",
            fontSize: 30,
          };
          const frontStyle: CSSProperties = {
            ...faceBase,
            background: `linear-gradient(165deg, color-mix(in oklch, ${t.accentDark} 30%, oklch(0.16 0.01 265)), oklch(0.13 0.01 265))`,
            border: `1.5px solid ${isBest ? bestTier.glowDark : t.accentDark}`,
            boxShadow: isBest
              ? `0 0 26px color-mix(in oklch, ${bestTier.glowDark} 70%, transparent), inset 0 0 20px oklch(0 0 0 / 0.35)`
              : "inset 0 0 20px oklch(0 0 0 / 0.35)",
          };
          return (
            <div key={i} style={cardWrap}>
              <div style={cardInner}>
                <div style={backStyle}>◈</div>
                <div style={frontStyle}>
                  <span style={{ fontSize: 34, lineHeight: 1, color: t.glowDark, textShadow: `0 0 18px ${t.glowDark}` }}>{t.sigil}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.96 0 0)" }}>{t.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button style={closeStyle} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
