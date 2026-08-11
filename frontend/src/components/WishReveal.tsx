import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { TIERS } from "@/lib/tiers";
import { currentOdds, drawTier } from "@/lib/gacha";

type Phase = "idle" | "charge" | "beam" | "burst" | "card" | "flipped" | "done";

type Mote = { style: CSSProperties };

function makeMotes(glow: string): Mote[] {
  const arr: Mote[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 20 + Math.random() * 60;
    const delay = Math.random() * 1.2;
    const dur = 1.6 + Math.random() * 1.4;
    const sz = 2 + Math.random() * 3;
    arr.push({
      style: {
        position: "absolute",
        left: `${x}%`,
        bottom: "40%",
        width: sz,
        height: sz,
        borderRadius: "50%",
        background: glow,
        boxShadow: `0 0 8px ${glow}`,
        animation: `wr-rise ${dur}s ${delay}s ease-out infinite`,
      },
    });
  }
  return arr;
}

export function WishReveal({ tierIdx, onContinue, pityKey }: { tierIdx: number; onContinue: (tierIdx: number) => void; pityKey?: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeTier, setActiveTier] = useState(tierIdx);
  const [odds, setOdds] = useState(() => (pityKey ? currentOdds(pityKey) : currentOdds()));
  const [motes, setMotes] = useState<Mote[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const begin = (idx: number) => {
    clearTimers();
    setPhase("charge");
    setActiveTier(idx);
    setMotes(makeMotes(TIERS[idx].glowDark));
    timers.current = [
      setTimeout(() => setPhase("beam"), 1100),
      setTimeout(() => setPhase("burst"), 2000),
      setTimeout(() => setPhase("card"), 2450),
      setTimeout(() => setPhase("flipped"), 3050),
      setTimeout(() => setPhase("done"), 3900),
    ];
  };

  useEffect(() => {
    begin(tierIdx);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    clearTimers();
    setPhase("done");
  };

  const replay = () => {
    const d = pityKey ? drawTier(pityKey) : drawTier();
    setOdds(pityKey ? currentOdds(pityKey) : currentOdds());
    begin(d.tierIdx);
  };

  const handleContinue = () => onContinue(activeTier);

  const t = TIERS[activeTier] ?? TIERS[2];

  const cardShown = phase === "card" || phase === "flipped" || phase === "done";
  const flipped = phase === "flipped" || phase === "done";
  const done = phase === "done";
  const beamOn = phase === "beam" || phase === "burst";
  const motesShown = phase === "burst" || phase === "card" || phase === "flipped" || phase === "done";

  const glowStyle: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${t.glowDark}, transparent 70%)`,
      transform: `translate(-50%,-50%) scale(${phase === "charge" ? 7 : 0})`,
      opacity: phase === "charge" ? 1 : 0,
      transition: "transform 1s ease-out, opacity 0.6s ease",
    }),
    [phase, t.glowDark],
  );

  const beamStyle: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      top: 0,
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: beamOn ? 150 : 0,
      background: `linear-gradient(to right, transparent, ${t.glowDark}, transparent)`,
      filter: "blur(7px)",
      opacity: phase === "beam" ? 0.95 : phase === "burst" ? 0.4 : 0,
      transition: "width 0.45s ease-out, opacity 0.7s ease",
    }),
    [beamOn, phase, t.glowDark],
  );

  const flashStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(circle at center, ${t.glowDark}, transparent 55%)`,
    opacity: phase === "burst" ? 0.85 : 0,
    transition: "opacity 0.5s ease",
    pointerEvents: "none",
  };

  const starfieldStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(1px 1px at 20% 30%, oklch(1 0 0 / 0.5), transparent), radial-gradient(1px 1px at 70% 20%, oklch(1 0 0 / 0.4), transparent), radial-gradient(1.5px 1.5px at 40% 70%, oklch(1 0 0 / 0.35), transparent), radial-gradient(1px 1px at 85% 65%, oklch(1 0 0 / 0.4), transparent), radial-gradient(1px 1px at 55% 45%, oklch(1 0 0 / 0.3), transparent), radial-gradient(1px 1px at 12% 80%, oklch(1 0 0 / 0.35), transparent)",
    opacity: 0.9,
    animation: "wr-twinkle 3s ease-in-out infinite",
  };

  const preTextStyle: CSSProperties = {
    position: "absolute",
    top: "30%",
    fontSize: 13,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "oklch(0.7 0 0)",
    opacity: phase === "charge" || phase === "beam" ? 0.85 : 0,
    transition: "opacity 0.5s ease",
  };

  const cardWrapStyle: CSSProperties = {
    position: "relative",
    width: 260,
    height: 380,
    perspective: 1400,
    opacity: cardShown ? 1 : 0,
    transform: `translateY(${cardShown ? 0 : 24}px) scale(${cardShown ? 1 : 0.92})`,
    transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(.2,.7,.2,1)",
  };
  const cardInnerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    transformStyle: "preserve-3d",
    transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
    transition: "transform 0.85s cubic-bezier(.2,.75,.2,1)",
  };
  const faceBase: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: 18,
    backfaceVisibility: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };
  const cardBackStyle: CSSProperties = {
    ...faceBase,
    transform: "rotateY(180deg)",
    background: "linear-gradient(160deg, oklch(0.28 0.02 265), oklch(0.16 0.02 265))",
    border: "1px solid oklch(1 0 0 / 0.12)",
    color: "oklch(0.7 0 0)",
    boxShadow: "inset 0 0 40px oklch(0 0 0 / 0.4)",
  };
  const cardFrontStyle: CSSProperties = {
    ...faceBase,
    gap: 20,
    padding: "28px 22px",
    background: `linear-gradient(165deg, color-mix(in oklch, ${t.accentDark} 24%, oklch(0.16 0.01 265)), oklch(0.13 0.01 265))`,
    border: `1.5px solid ${t.accentDark}`,
    boxShadow: `0 0 60px color-mix(in oklch, ${t.glowDark} 55%, transparent), inset 0 0 50px oklch(0 0 0 / 0.35)`,
  };
  const cardFrontTagStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: t.glowDark,
    border: `1px solid color-mix(in oklch, ${t.accentDark} 60%, transparent)`,
    borderRadius: 999,
    padding: "4px 12px",
  };
  const cardSigilStyle: CSSProperties = {
    fontSize: 84,
    lineHeight: 1,
    color: t.glowDark,
    textShadow: `0 0 30px ${t.glowDark}`,
    animation: done ? "wr-halo 2.4s ease-in-out infinite" : "none",
  };

  const actionsStyle: CSSProperties = {
    position: "absolute",
    bottom: 52,
    display: "flex",
    gap: 12,
    alignItems: "center",
    opacity: done ? 1 : 0,
    transform: `translateY(${done ? 0 : 10}px)`,
    transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
    pointerEvents: done ? "auto" : "none",
  };
  const continueStyle: CSSProperties = {
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
  const replayBtnStyle: CSSProperties = {
    height: 42,
    padding: "0 20px",
    font: "inherit",
    fontSize: 14,
    fontWeight: 500,
    color: "oklch(0.9 0 0)",
    background: "transparent",
    border: "1px solid oklch(1 0 0 / 0.22)",
    borderRadius: 10,
    cursor: "pointer",
  };
  const skipStyle: CSSProperties = {
    position: "absolute",
    top: 28,
    right: 28,
    font: "inherit",
    fontSize: 13,
    fontWeight: 500,
    color: "oklch(0.6 0 0)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    opacity: done ? 0 : 0.8,
    transition: "opacity 0.4s ease",
    pointerEvents: done ? "none" : "auto",
  };

  const legPct = odds.legendary < 10 ? odds.legendary.toFixed(1) : Math.round(odds.legendary);
  const pityLabel = `Legendary pity  ${odds.p5} / ${odds.hard5}`;
  const oddsLabel = `next-pull odds  ${legPct}%`;
  const pityStyle: CSSProperties = {
    position: "absolute",
    top: 28,
    left: 28,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    fontFamily: "'Geist Mono Variable', ui-monospace, monospace",
    fontSize: 11,
    letterSpacing: "0.04em",
    color: "oklch(0.66 0 0)",
    opacity: 0.85,
  };
  const creditStyle: CSSProperties = {
    position: "absolute",
    bottom: 18,
    fontSize: 10,
    letterSpacing: "0.03em",
    color: "oklch(0.5 0 0)",
    opacity: done ? 0.7 : 0,
    transition: "opacity 0.5s ease 0.3s",
    textAlign: "center",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        fontFamily: "'Geist Variable', system-ui, sans-serif",
        background: "radial-gradient(circle at 50% 55%, oklch(0.19 0.015 265), oklch(0.09 0.01 265))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={starfieldStyle} />
      <div style={glowStyle} />
      <div style={beamStyle} />
      <div style={flashStyle} />
      {motesShown && motes.map((m, i) => <span key={i} style={m.style} />)}

      <div style={preTextStyle}>The proof resolves…</div>

      <div style={cardWrapStyle}>
        <div style={cardInnerStyle}>
          <div style={cardBackStyle}>
            <div style={{ fontSize: 44, opacity: 0.9 }}>◈</div>
          </div>
          <div style={cardFrontStyle}>
            <div style={cardFrontTagStyle}>{t.name}</div>
            <div style={cardSigilStyle}>{t.sigil}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: "oklch(0.98 0 0)", textAlign: "center" }}>
                {t.flavor}
              </div>
              <div style={{ fontSize: 12, color: "oklch(0.72 0 0)", textAlign: "center", lineHeight: 1.5, maxWidth: 210 }}>{t.blurb}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.6 0 0)" }}>
              Cosmetic · no value
            </div>
          </div>
        </div>
      </div>

      <div style={actionsStyle}>
        <button onClick={replay} style={replayBtnStyle}>
          Pull again
        </button>
        <button onClick={handleContinue} style={continueStyle}>
          Continue
        </button>
      </div>

      <div style={pityStyle}>
        <span>{pityLabel}</span>
        <span>{oddsLabel}</span>
      </div>

      <div style={creditStyle}>Pity model ported from Mantan21/Genshin-Impact-Wish-Simulator (MIT) · all visuals original</div>

      <button onClick={skip} style={skipStyle}>
        Skip ›
      </button>
    </div>
  );
}
