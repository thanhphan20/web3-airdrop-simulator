import { useState, type CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { WishBanner } from "@/components/WishBanner";
import { WishReveal } from "@/components/WishReveal";
import { WishRevealMulti } from "@/components/WishRevealMulti";
import { WishHistory } from "@/components/WishHistory";
import { WISH_KEY, drawMulti, drawTier, pushWishHistory } from "@/lib/gacha";

export const Route = createFileRoute("/wish")({ component: WishPage });

function WishPage() {
  const [tierIdx, setTierIdx] = useState<number | null>(null);
  const [multiResults, setMultiResults] = useState<{ tierIdx: number }[] | null>(null);

  const handlePull = (count: 1 | 10) => {
    if (count === 1) {
      const drawn = drawTier(WISH_KEY);
      pushWishHistory(drawn.tierIdx);
      setTierIdx(drawn.tierIdx);
    } else {
      const results = drawMulti(10, WISH_KEY);
      results.forEach((r) => pushWishHistory(r.tierIdx));
      setMultiResults(results);
    }
  };

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 24px 96px",
    background:
      "radial-gradient(125% 95% at 50% -8%, oklch(0.22 0.02 270) 0%, oklch(0.13 0.015 265) 48%, oklch(0.09 0.01 265) 100%)",
  };

  const colStyle: CSSProperties = {
    width: "100%",
    maxWidth: 460,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    fontFamily: "'Geist Variable', system-ui, sans-serif",
  };

  const backStyle: CSSProperties = {
    fontSize: 13,
    color: "oklch(0.62 0.02 280)",
    textDecoration: "none",
  };

  return (
    <div style={pageStyle}>
      <div style={colStyle}>
        <Link to="/" style={backStyle}>
          ← Back to airdrop
        </Link>
        <WishBanner onPull={handlePull} />
        <WishHistory />
      </div>

      {tierIdx !== null && <WishReveal tierIdx={tierIdx} onContinue={() => setTierIdx(null)} pityKey={WISH_KEY} />}
      {multiResults !== null && <WishRevealMulti results={multiResults} onClose={() => setMultiResults(null)} />}
    </div>
  );
}
