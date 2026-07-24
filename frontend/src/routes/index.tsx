import { createFileRoute } from "@tanstack/react-router";
import { ConnectButton } from "@/components/ConnectButton";
import { ClaimCard } from "@/components/ClaimCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Merkle Airdrop Claim (Sepolia testnet)</h1>
      <ConnectButton />
      <ClaimCard />
    </div>
  );
}
