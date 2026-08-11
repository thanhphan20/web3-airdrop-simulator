import type { CSSProperties } from "react";
import { getWishHistory } from "@/lib/gacha";
import { TIERS } from "@/lib/tiers";

export function WishHistory() {
  const history = getWishHistory();

  const cardStyle: CSSProperties = {
    background: "oklch(0.16 0.015 265 / 0.85)",
    border: "1px solid oklch(0.72 0.11 80 / 0.25)",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "oklch(0.62 0.02 280)",
  };

  const emptyStyle: CSSProperties = {
    margin: 0,
    fontSize: 13,
    color: "oklch(0.5 0 0)",
    textAlign: "center",
    padding: "14px 0 10px",
  };

  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 11,
    fontSize: 13,
    color: "oklch(0.85 0 0)",
    padding: "7px 6px",
    borderRadius: 9,
    background: "oklch(1 0 0 / 0.03)",
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>Pull history</span>
        <span>{history.length} / 50</span>
      </div>
      {history.length === 0 ? (
        <p style={emptyStyle}>No pulls yet.</p>
      ) : (
        history.map((tierIdx, i) => {
          const t = TIERS[tierIdx] ?? TIERS[0];
          return (
            <div key={i} style={rowStyle}>
              <span style={{ width: 16, fontSize: 11, color: "oklch(0.5 0 0)", textAlign: "right" }}>{i + 1}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.accentLight, boxShadow: `0 0 8px ${t.glowLight}`, flexShrink: 0 }} />
              <span style={{ width: 18, textAlign: "center", color: t.glowLight }}>{t.sigil}</span>
              <span>{t.name}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
