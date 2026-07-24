import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import merkleAirdropAbi from "../abi/MerkleAirdrop.json";
import proofs from "../data/merkle-proofs.json";
import { AIRDROP_ADDRESS } from "../wagmi.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProofEntry = { amount: string; proof: `0x${string}`[] };
const proofsByAddress = proofs as Record<string, ProofEntry>;

export function ClaimCard() {
  const { address } = useAccount();

  // case-insensitive lookup since the connected address's checksum casing
  // may not match the JSON key exactly
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

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  if (isConfirmed) refetchHasClaimed();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Airdrop status</CardTitle>
      </CardHeader>
      <CardContent>
        {!address && <p className="text-sm text-muted-foreground">Connect your wallet to check eligibility.</p>}

        {address && !entry && <p className="text-sm text-muted-foreground">Not eligible for this airdrop.</p>}

        {address && entry && (hasClaimed || isConfirmed) && (
          <p className="text-sm text-muted-foreground">
            Already claimed.
            {txHash && (
              <>
                {" "}
                <a
                  className="underline"
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                </a>
              </>
            )}
          </p>
        )}

        {address && entry && !hasClaimed && !isConfirmed && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">Eligible amount: {entry.amount}</p>
            <Button
              onClick={() =>
                writeContract({
                  address: AIRDROP_ADDRESS,
                  abi: merkleAirdropAbi,
                  functionName: "claim",
                  args: [address, BigInt(entry.amount), entry.proof],
                })
              }
              disabled={isPending || isConfirming}
            >
              {isPending || isConfirming ? "Claiming..." : "Claim"}
            </Button>
            {error && <p className="text-sm text-destructive">Error: {error.message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
