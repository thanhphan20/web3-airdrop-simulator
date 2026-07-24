import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono">{address}</span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  const injectedConnector = connectors[0];

  return (
    <Button onClick={() => connect({ connector: injectedConnector })} disabled={isPending}>
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
