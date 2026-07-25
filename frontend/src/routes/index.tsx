import { createFileRoute } from "@tanstack/react-router";
import { ConnectButton } from "@/components/ConnectButton";
import { ClaimCard } from "@/components/ClaimCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "52px 24px 120px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(125% 95% at 50% -8%, oklch(0.995 0.012 96) 0%, oklch(0.98 0.025 94) 30%, oklch(0.945 0.045 90) 66%, oklch(0.9 0.06 84) 100%)",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: 0,
          right: 0,
          height: "130%",
          pointerEvents: "none",
          zIndex: 0,
          animation: "om-rays 7s ease-in-out infinite",
          filter: "blur(3px)",
          WebkitMaskImage: "radial-gradient(72% 62% at 50% 0%, black, transparent 76%)",
          maskImage: "radial-gradient(72% 62% at 50% 0%, black, transparent 76%)",
          background:
            "repeating-conic-gradient(from 90deg at 50% 0%, oklch(1 0 0 / 0.35) 0deg 2.5deg, transparent 2.5deg 13deg)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: "radial-gradient(circle at 50% 40%, oklch(0.92 0.09 88 / 0.4), transparent 46%)",
        }}
      />

      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 22, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "linear-gradient(150deg, oklch(0.95 0.06 92), oklch(0.8 0.11 82))",
                color: "oklch(0.32 0.05 60)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                boxShadow: "0 4px 16px oklch(0.82 0.11 85 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.7)",
              }}
            >
              ❖
            </div>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.14em", color: "oklch(0.34 0.03 80)" }}>
              MERKLE AIRDROP
            </span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 500,
              color: "oklch(0.42 0.02 82)",
              background: "oklch(1 0 0 / 0.72)",
              border: "1px solid oklch(1 0 0 / 0.9)",
              borderRadius: 999,
              padding: "5px 11px",
              boxShadow: "0 2px 10px oklch(0.62 0.06 80 / 0.18)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.7 0.16 150)", boxShadow: "0 0 6px oklch(0.7 0.16 150)" }} />
            Sepolia testnet
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center", padding: "6px 0 2px" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Cinzel', serif",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.15,
              color: "oklch(0.3 0.025 80)",
              textShadow: "0 2px 22px oklch(1 0 0 / 0.9), 0 0 40px oklch(0.9 0.08 90 / 0.5)",
            }}
          >
            Claim your allocation
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "oklch(0.7 0.11 78)" }}>
            <span style={{ height: 1, width: 46, background: "linear-gradient(to right, transparent, oklch(0.72 0.11 80 / 0.7))" }} />
            <span style={{ fontSize: 10 }}>◆</span>
            <span style={{ height: 1, width: 46, background: "linear-gradient(to left, transparent, oklch(0.72 0.11 80 / 0.7))" }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "oklch(0.46 0.02 82)", lineHeight: 1.55, maxWidth: 380 }}>
            Eligibility is verified against a fixed merkle proof. Connect a wallet to check your address.
          </p>
        </div>

        <ConnectButton />
        <ClaimCard />

        <p style={{ margin: 0, fontSize: 12, color: "oklch(0.56 0.02 82)", textAlign: "center", lineHeight: 1.55 }}>
          Testnet demo · tokens have no value. The cosmetic reward is decided client-side and never touches the real claim.
        </p>
      </div>
    </div>
  );
}
