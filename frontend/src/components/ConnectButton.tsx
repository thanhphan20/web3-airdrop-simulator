import { useAccount, useDisconnect } from "wagmi";

function short(address: string) {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

// When disconnected, this renders nothing — ClaimCard's own "Connect Wallet"
// CTA (inside the frosted status card) is the sole entry point, matching the
// design's single-CTA disconnected state.
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected || !address) return null;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: "oklch(1 0 0 / 0.66)",
        border: "1px solid oklch(1 0 0 / 0.85)",
        borderRadius: 12,
        padding: "10px 12px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 18px oklch(0.62 0.06 80 / 0.16)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, oklch(0.78 0.13 250), oklch(0.76 0.15 300))",
            flexShrink: 0,
            boxShadow: "0 0 12px oklch(0.76 0.14 285 / 0.5)",
          }}
        />
        <span
          style={{
            fontFamily: "'Geist Mono Variable', monospace",
            fontSize: 13,
            color: "oklch(0.32 0.02 80)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {short(address)}
        </span>
      </div>
      <button
        onClick={() => disconnect()}
        style={{
          flexShrink: 0,
          height: 30,
          padding: "0 13px",
          font: "inherit",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: "oklch(0.5 0.09 66)",
          background: "oklch(1 0 0 / 0.7)",
          border: "1px solid oklch(0.75 0.09 78 / 0.5)",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Disconnect
      </button>
    </div>
  );
}
