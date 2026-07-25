import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatUnits } from "viem";
import { useAccount, useConnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import merkleAirdropAbi from "../abi/MerkleAirdrop.json";
import proofs from "../data/merkle-proofs.json";
import { AIRDROP_ADDRESS } from "../wagmi.config";
import { TIERS, cornerBracketStyle, rollTier } from "@/lib/tiers";
import { drawTier } from "@/lib/gacha";
import { isInsufficientFundsError, isProviderNotFoundError, shortErrorMessage } from "@/lib/errors";
import { WishReveal } from "@/components/WishReveal";

type ProofEntry = { amount: string; proof: `0x${string}`[] };
const proofsByAddress = proofs as Record<string, ProofEntry>;

type Step = "disconnected" | "not_eligible" | "eligible" | "claiming" | "reveal" | "claimed" | "already_claimed";

const CLAIMS_KEY = "mrkl_gacha_claims_v1";

function readClaimTier(address: string): number | undefined {
  try {
    const map = JSON.parse(localStorage.getItem(CLAIMS_KEY) || "{}");
    return map[address.toLowerCase()];
  } catch {
    return undefined;
  }
}

function saveClaimTier(address: string, tierIdx: number) {
  try {
    const map = JSON.parse(localStorage.getItem(CLAIMS_KEY) || "{}");
    map[address.toLowerCase()] = tierIdx;
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

const gold = "oklch(0.56 0.11 70)";
const green = "oklch(0.5 0.12 150)";
const red = "oklch(0.55 0.12 38)";
const mut = "oklch(0.5 0.02 82)";

const pillMap: Record<Step, [string, string, string, string]> = {
  disconnected: ["Not connected", mut, "oklch(0.97 0.02 88 / 0.85)", "oklch(0.7 0.06 80 / 0.28)"],
  not_eligible: ["Ineligible", red, "oklch(0.96 0.03 38 / 0.85)", "oklch(0.7 0.1 38 / 0.35)"],
  eligible: ["Eligible", gold, "oklch(0.96 0.05 86 / 0.9)", "oklch(0.75 0.1 80 / 0.45)"],
  claiming: ["Confirming", gold, "oklch(0.96 0.05 86 / 0.9)", "oklch(0.75 0.1 80 / 0.45)"],
  reveal: ["Confirming", gold, "oklch(0.96 0.05 86 / 0.9)", "oklch(0.75 0.1 80 / 0.45)"],
  claimed: ["Claimed", green, "oklch(0.95 0.05 150 / 0.9)", "oklch(0.7 0.12 150 / 0.4)"],
  already_claimed: ["Claimed", green, "oklch(0.95 0.05 150 / 0.9)", "oklch(0.7 0.12 150 / 0.4)"],
};

const ctaStyle: CSSProperties = {
  height: 46,
  padding: "0 18px",
  width: "100%",
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
const ctaDisabledStyle: CSSProperties = { ...ctaStyle, animation: "none", opacity: 0.55, cursor: "default", boxShadow: "none" };

const simulateBtnStyle: CSSProperties = {
  alignSelf: "center",
  height: 32,
  padding: "0 14px",
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.02em",
  color: "oklch(0.5 0.09 66)",
  background: "oklch(1 0 0 / 0.6)",
  border: "1px solid oklch(0.72 0.06 80 / 0.4)",
  borderRadius: 8,
  cursor: "pointer",
};

export function ClaimCard() {
  const { address, connector } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];
  const simulateConnector = connectors.find((c) => c.type === "mock") ?? connectors[connectors.length - 1];
  const isSimulatedWallet = connector?.id === "mock";

  const entry = address
    ? Object.entries(proofsByAddress).find(([addr]) => addr.toLowerCase() === address.toLowerCase())?.[1]
    : undefined;

  const { data: hasClaimed, refetch: refetchHasClaimed } = useReadContract({
    address: AIRDROP_ADDRESS,
    abi: merkleAirdropAbi,
    functionName: "hasClaimed",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && entry) },
  });

  // The real path: an injected wallet signs and broadcasts through wagmi.
  const { writeContract, data: writeHash, isPending: isWritePending, error: writeError, reset: resetWriteContract } = useWriteContract();
  const { isLoading: isWriteConfirming, isSuccess: isWriteConfirmed } = useWaitForTransactionReceipt({ hash: writeHash });

  // The simulated path: no chain call at all — just a local timer that mimics the
  // pending -> confirmed shape of a real claim, purely for the frontend flow/reveal.
  const [simPending, setSimPending] = useState(false);
  const [simConfirmed, setSimConfirmed] = useState(false);
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPending = isSimulatedWallet ? simPending : isWritePending;
  const isConfirming = isSimulatedWallet ? false : isWriteConfirming;
  const isConfirmed = isSimulatedWallet ? simConfirmed : isWriteConfirmed;
  const txHash = isSimulatedWallet ? undefined : writeHash;
  const error = isSimulatedWallet ? null : writeError;

  const [justClaimed, setJustClaimed] = useState(false);
  const [revealFinished, setRevealFinished] = useState(false);
  const [tierIdx, setTierIdx] = useState<number | null>(null);

  // A claim recorded locally (real or simulated) always counts as "already claimed" —
  // simulated claims never touch the real hasClaimed contract read.
  const storedTierIdx = address ? readClaimTier(address) : undefined;
  const hasClaimedAny = Boolean(hasClaimed) || storedTierIdx !== undefined;

  const refetchedRef = useRef(false);
  useEffect(() => {
    if (isConfirmed && !isSimulatedWallet && !refetchedRef.current) {
      refetchedRef.current = true;
      refetchHasClaimed();
    }
  }, [isConfirmed, isSimulatedWallet, refetchHasClaimed]);

  // Switching accounts (disconnect/reconnect as someone else) must not carry over the
  // previous account's claim/reveal state.
  const prevAddressRef = useRef(address);
  useEffect(() => {
    if (prevAddressRef.current !== address) {
      prevAddressRef.current = address;
      setJustClaimed(false);
      setRevealFinished(false);
      setTierIdx(null);
      refetchedRef.current = false;
      resetWriteContract();
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
      setSimPending(false);
      setSimConfirmed(false);
    }
  }, [address, resetWriteContract]);

  useEffect(() => () => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
  }, []);

  // Fires the cosmetic pity draw exactly once, right when our own claim confirms
  // (on-chain for a real wallet, or the simulated timer for the simulator).
  useEffect(() => {
    if (isConfirmed && justClaimed && tierIdx === null) {
      const drawn = drawTier();
      setTierIdx(drawn.tierIdx);
      if (address) saveClaimTier(address, drawn.tierIdx);
    }
  }, [isConfirmed, justClaimed, tierIdx, address]);

  // Returning visitor whose claim happened in an earlier session: resolve a stable
  // cosmetic without replaying the reveal animation.
  useEffect(() => {
    if (address && hasClaimedAny && !justClaimed && tierIdx === null) {
      const stored = readClaimTier(address);
      const idx = stored ?? rollTier();
      setTierIdx(idx);
      if (stored === undefined) saveClaimTier(address, idx);
    }
  }, [address, hasClaimedAny, justClaimed, tierIdx]);

  const step: Step = !address
    ? "disconnected"
    : !entry
      ? "not_eligible"
      : isPending || isConfirming
        ? "claiming"
        : isConfirmed && justClaimed && !revealFinished
          ? "reveal"
          : hasClaimedAny || isConfirmed
            ? justClaimed && revealFinished
              ? "claimed"
              : "already_claimed"
            : "eligible";

  const activeTierIdx = tierIdx ?? 0;
  const t = TIERS[activeTierIdx] ?? TIERS[0];
  const isAlready = step === "already_claimed";

  const handleConnect = () => connect({ connector: injectedConnector });
  const handleSimulateConnect = () => connect({ connector: simulateConnector });

  const handleClaim = () => {
    if (!address || !entry) return;
    setJustClaimed(true);
    setRevealFinished(false);
    setTierIdx(null);

    if (isSimulatedWallet) {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
      setSimConfirmed(false);
      setSimPending(true);
      simTimerRef.current = setTimeout(() => {
        setSimPending(false);
        setSimConfirmed(true);
      }, 1800);
      return;
    }

    writeContract({
      address: AIRDROP_ADDRESS,
      abi: merkleAirdropAbi,
      functionName: "claim",
      args: [address, BigInt(entry.amount), entry.proof],
    });
  };

  const finishReveal = () => setRevealFinished(true);

  const [statusLabel, pc, pbg, pbd] = pillMap[step];
  const statusPillStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: pc,
    background: pbg,
    border: `1px solid ${pbd}`,
    borderRadius: 999,
    padding: "4px 11px",
  };

  const trophyStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 11,
    padding: 17,
    borderRadius: 11,
    background: isAlready ? "oklch(0.985 0.012 88 / 0.8)" : `color-mix(in oklch, ${t.accentLight} 12%, oklch(1 0 0 / 0.82))`,
    border: `1px solid ${isAlready ? "oklch(0.72 0.06 80 / 0.28)" : `color-mix(in oklch, ${t.accentLight} 45%, transparent)`}`,
    boxShadow: isAlready ? "none" : `0 0 30px color-mix(in oklch, ${t.glowLight} 28%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.7)`,
  };
  const sigilChipStyle: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    color: "oklch(0.99 0 0)",
    flexShrink: 0,
    background: `linear-gradient(150deg, ${t.glowLight}, ${t.accentLight})`,
    boxShadow: isAlready ? "none" : `0 4px 18px color-mix(in oklch, ${t.glowLight} 55%, transparent)`,
  };
  const tierTagStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: t.accentLight,
  };
  const replayHint = isAlready ? "Pull already played" : "Reward saved";

  const amountTokens = entry ? formatUnits(BigInt(entry.amount), 18) : "0";

  const connectErrorMessage = connectError
    ? isProviderNotFoundError(connectError)
      ? "No wallet extension detected. Install one, or use Simulate Connect Wallet below."
      : shortErrorMessage(connectError)
    : null;

  const claimErrorMessage = error
    ? isInsufficientFundsError(error)
      ? "Your wallet doesn't have enough Sepolia ETH to cover gas."
      : shortErrorMessage(error)
    : null;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
      <div
        style={{
          position: "relative",
          background: "oklch(1 0 0 / 0.66)",
          border: "1px solid oklch(1 0 0 / 0.9)",
          borderRadius: 16,
          backdropFilter: "blur(16px)",
          boxShadow: "0 30px 70px oklch(0.55 0.07 78 / 0.22), 0 0 46px oklch(0.9 0.09 88 / 0.28), inset 0 1px 0 oklch(1 0 0 / 0.9)",
        }}
      >
        <span style={cornerBracketStyle("tl")} />
        <span style={cornerBracketStyle("tr")} />
        <span style={cornerBracketStyle("bl")} />
        <span style={cornerBracketStyle("br")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "oklch(0.42 0.04 72)",
              }}
            >
              Airdrop status
            </span>
            <span style={statusPillStyle}>{statusLabel}</span>
          </div>

          {step === "disconnected" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ margin: 0, fontSize: 14, color: "oklch(0.46 0.02 82)", lineHeight: 1.55 }}>
                Connect your wallet to check eligibility.
              </p>
              <button onClick={handleConnect} style={isConnecting ? ctaDisabledStyle : ctaStyle} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </button>
              {connectErrorMessage && <p style={{ margin: 0, fontSize: 12, color: red, textAlign: "center" }}>{connectErrorMessage}</p>}
              <button onClick={handleSimulateConnect} style={simulateBtnStyle}>
                Simulate Connect Wallet
              </button>
              <p style={{ margin: 0, fontSize: 11, color: "oklch(0.58 0.02 82)", textAlign: "center", lineHeight: 1.4 }}>
                No wallet extension? The simulator connects as a fixed test address from the eligibility list.
              </p>
            </div>
          )}

          {step === "not_eligible" && (
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: 15,
                background: "oklch(0.98 0.02 40 / 0.75)",
                border: "1px solid oklch(0.72 0.09 38 / 0.35)",
                borderRadius: 11,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1.3, color: "oklch(0.6 0.11 40)" }}>○</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.34 0.03 40)" }}>Not eligible for this airdrop</span>
                <span style={{ fontSize: 13, color: "oklch(0.5 0.03 40)", lineHeight: 1.5 }}>
                  This address isn't in the eligibility set. Only the fixed list committed to the merkle root can claim.
                </span>
              </div>
            </div>
          )}

          {step === "eligible" && entry && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  padding: 18,
                  background: "linear-gradient(160deg, oklch(0.99 0.02 92 / 0.85), oklch(0.97 0.04 88 / 0.7))",
                  border: "1px solid oklch(0.78 0.1 82 / 0.4)",
                  borderRadius: 11,
                  boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.8)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.58 0.1 72)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Eligible amount
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 36, fontWeight: 700, letterSpacing: "0.005em", color: "oklch(0.32 0.03 72)" }}>
                    {amountTokens}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.56 0.1 72)" }}>MRKL</span>
                </div>
                <span style={{ fontFamily: "'Geist Mono Variable', monospace", fontSize: 11, color: "oklch(0.62 0.02 82)" }}>{entry.amount} wei</span>
              </div>

              <button onClick={handleClaim} style={ctaStyle}>
                Claim {amountTokens} MRKL
              </button>
              <p style={{ margin: 0, fontSize: 12, color: "oklch(0.56 0.02 82)", textAlign: "center", lineHeight: 1.45 }}>
                {isSimulatedWallet ? "Simulated · no real transaction is sent" : "Verified by merkle proof · no gas on testnet"}
              </p>
              {claimErrorMessage && <p style={{ margin: 0, fontSize: 12, color: red, textAlign: "center" }}>{claimErrorMessage}</p>}
            </div>
          )}

          {step === "claiming" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: 18,
                  background: "oklch(0.98 0.015 92 / 0.75)",
                  border: "1px solid oklch(0.8 0.08 84 / 0.35)",
                  borderRadius: 11,
                }}
              >
                <span
                  style={{
                    width: 19,
                    height: 19,
                    border: "2px solid oklch(0.86 0.04 90)",
                    borderTopColor: "oklch(0.68 0.12 76)",
                    borderRadius: "50%",
                    animation: "om-spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.34 0.02 80)" }}>
                    {isSimulatedWallet ? "Simulating claim…" : "Submitting claim…"}
                  </span>
                  <span style={{ fontSize: 13, color: "oklch(0.5 0.02 82)" }}>
                    {isSimulatedWallet ? "No real transaction is sent." : "Waiting for on-chain confirmation."}
                  </span>
                </div>
              </div>
              <button disabled style={ctaDisabledStyle}>
                Claiming…
              </button>
            </div>
          )}

          {(step === "claimed" || step === "already_claimed") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 18,
                  background: "oklch(0.98 0.02 150 / 0.75)",
                  border: "1px solid oklch(0.72 0.13 150 / 0.35)",
                  borderRadius: 11,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.52 0.12 150)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Claimed
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700, color: "oklch(0.3 0.03 160)" }}>
                      {amountTokens}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.52 0.1 150)" }}>MRKL</span>
                  </div>
                </div>
                <span style={{ fontSize: 22, color: "oklch(0.6 0.15 150)", textShadow: "0 0 14px oklch(0.7 0.16 150 / 0.5)" }}>✓</span>
              </div>

              <div style={trophyStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={sigilChipStyle}>{t.sigil}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <span style={tierTagStyle}>{t.name} · cosmetic</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 17, fontWeight: 600, letterSpacing: "0.01em", color: "oklch(0.3 0.02 80)" }}>
                      {t.flavor}
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "oklch(0.5 0.02 82)", lineHeight: 1.5 }}>{t.blurb}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                {txHash ? (
                  <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
                    View transaction ↗
                  </a>
                ) : isSimulatedWallet ? (
                  <span style={{ fontSize: 12, color: "oklch(0.58 0.02 82)" }}>Simulated · no on-chain transaction</span>
                ) : (
                  <span />
                )}
                <span style={{ fontSize: 12, color: "oklch(0.58 0.02 82)" }}>{replayHint}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {step === "reveal" && <WishReveal tierIdx={activeTierIdx} onContinue={finishReveal} />}
    </div>
  );
}
