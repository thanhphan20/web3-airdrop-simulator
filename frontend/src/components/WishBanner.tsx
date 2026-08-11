import type { CSSProperties } from "react";
import { WISH_KEY, currentOdds } from "@/lib/gacha";
import { cornerBracketStyle } from "@/lib/tiers";

export function WishBanner({ onPull }: { onPull: (count: 1 | 10) => void }) {
  const odds = currentOdds(WISH_KEY);
  const legPct = odds.legendary < 10 ? odds.legendary.toFixed(1) : Math.round(odds.legendary);

  const stageStyle: CSSProperties = {
    position: "relative",
    padding: "40px 22px 22px",
    borderRadius: 18,
    overflow: "hidden",
    background: "radial-gradient(120% 110% at 50% 0%, oklch(0.24 0.03 270), oklch(0.13 0.015 265) 70%)",
    border: "1px solid oklch(0.72 0.11 80 / 0.4)",
    boxShadow: "0 0 50px oklch(0.72 0.11 80 / 0.14), inset 0 0 60px oklch(0 0 0 / 0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const watermarkStyle: CSSProperties = {
    position: "absolute",
    top: 14,
    fontSize: 120,
    lineHeight: 1,
    color: "oklch(0.72 0.11 80 / 0.08)",
    pointerEvents: "none",
    textShadow: "0 0 40px oklch(0.72 0.11 80 / 0.3)",
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontFamily: "'Cinzel', serif",
    fontSize: 27,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "oklch(0.94 0.04 90)",
    textShadow: "0 2px 22px oklch(0 0 0 / 0.5), 0 0 34px oklch(0.82 0.13 85 / 0.5)",
  };

  const subStyle: CSSProperties = {
    margin: 0,
    fontSize: 13,
    color: "oklch(0.68 0.02 280)",
    lineHeight: 1.5,
    maxWidth: 320,
  };

  const dividerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "oklch(0.72 0.11 80 / 0.7)",
  };

  const pullRowStyle: CSSProperties = {
    display: "flex",
    gap: 12,
    width: "100%",
    marginTop: 4,
  };

  const pullBtnStyle: CSSProperties = {
    flex: 1,
    height: 46,
    padding: "0 18px",
    font: "inherit",
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "oklch(0.3 0.05 62)",
    border: "1px solid oklch(0.74 0.1 80)",
    borderRadius: 12,
    cursor: "pointer",
    background:
      "linear-gradient(100deg, oklch(0.8 0.11 80) 0%, oklch(0.9 0.09 88) 42%, oklch(0.99 0.03 96) 50%, oklch(0.9 0.09 88) 58%, oklch(0.8 0.11 80) 100%)",
    backgroundSize: "220% 100%",
    animation: "om-sweep 3.4s linear infinite",
    boxShadow: "0 8px 26px oklch(0.78 0.11 82 / 0.4), 0 0 30px oklch(0.9 0.09 88 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.6)",
  };

  const oddsStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginTop: 14,
    fontFamily: "'Geist Mono Variable', ui-monospace, monospace",
    fontSize: 11,
    letterSpacing: "0.04em",
    color: "oklch(0.66 0 0)",
  };

  return (
    <div style={stageStyle}>
      <span style={cornerBracketStyle("tl")} />
      <span style={cornerBracketStyle("tr")} />
      <span style={cornerBracketStyle("bl")} />
      <span style={cornerBracketStyle("br")} />
      <div style={watermarkStyle}>✦</div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <h1 style={titleStyle}>Genesis Wish</h1>
        <p style={subStyle}>Draw a leaf from the merkle tree. Every pull is pure cosmetic — no tokens, no value.</p>
        <div style={dividerStyle}>
          <span style={{ height: 1, width: 46, background: "linear-gradient(to right, transparent, oklch(0.72 0.11 80 / 0.7))" }} />
          <span style={{ fontSize: 10 }}>◆</span>
          <span style={{ height: 1, width: 46, background: "linear-gradient(to left, transparent, oklch(0.72 0.11 80 / 0.7))" }} />
        </div>
      </div>

      <div style={pullRowStyle}>
        <button style={pullBtnStyle} onClick={() => onPull(1)}>
          1×
        </button>
        <button style={pullBtnStyle} onClick={() => onPull(10)}>
          10×
        </button>
      </div>

      <div style={oddsStyle}>
        <span>Legendary pity  {odds.p5} / {odds.hard5}</span>
        <span>next-pull odds  {legPct}%</span>
      </div>
    </div>
  );
}
