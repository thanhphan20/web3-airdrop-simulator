import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { foundry } from "wagmi/chains";
import type { Abi } from "viem";
import pointsProtocolAbiJson from "../abi/PointsProtocol.json";
import { POINTS_ADDRESS } from "../wagmi.config";
import { TASK_IDS } from "@/lib/points";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isProviderNotFoundError, shortErrorMessage } from "@/lib/errors";

// A wallet-required demo: unlike ClaimCard's dual real/simulated path, manually
// farming points *is* the point here, so there's no "simulate connect" option.
type PendingAction = "checkIn" | { taskId: number } | null;

const pointsProtocolAbi = pointsProtocolAbiJson as Abi;

export function PointsCard() {
  const { address, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];

  const onFoundry = chain?.id === foundry.id;
  const enabled = Boolean(address && onFoundry);

  const { data: points, refetch: refetchPoints } = useReadContract({
    address: POINTS_ADDRESS,
    abi: pointsProtocolAbi,
    functionName: "points",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: lastCheckIn, refetch: refetchLastCheckIn } = useReadContract({
    address: POINTS_ADDRESS,
    abi: pointsProtocolAbi,
    functionName: "lastCheckIn",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: checkInInterval } = useReadContract({
    address: POINTS_ADDRESS,
    abi: pointsProtocolAbi,
    functionName: "CHECK_IN_INTERVAL",
    query: { enabled },
  });

  const { data: completedTasks, refetch: refetchCompletedTasks } = useReadContracts({
    contracts: TASK_IDS.map((taskId) => ({
      address: POINTS_ADDRESS,
      abi: pointsProtocolAbi,
      functionName: "hasCompletedTask",
      args: address ? [address, taskId] : undefined,
    })),
    query: { enabled },
  });

  const { writeContract, data: hash, isPending: isWritePending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    if (isConfirmed) {
      refetchPoints();
      refetchLastCheckIn();
      refetchCompletedTasks();
      setPendingAction(null);
      reset();
    }
  }, [isConfirmed, refetchPoints, refetchLastCheckIn, refetchCompletedTasks, reset]);

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const nextCheckInTime = lastCheckIn && checkInInterval ? Number(lastCheckIn) + Number(checkInInterval) : 0;
  const onCooldown = nextCheckInTime > now;
  const isBusy = isWritePending || isConfirming;

  const handleCheckIn = () => {
    setPendingAction("checkIn");
    writeContract({ address: POINTS_ADDRESS, abi: pointsProtocolAbi, functionName: "checkIn" });
  };

  const handleCompleteTask = (taskId: number) => {
    setPendingAction({ taskId });
    writeContract({ address: POINTS_ADDRESS, abi: pointsProtocolAbi, functionName: "completeTask", args: [taskId] });
  };

  const errorMessage = writeError ? shortErrorMessage(writeError) : null;
  const connectErrorMessage = connectError
    ? isProviderNotFoundError(connectError)
      ? "No wallet extension detected. Install one (e.g. MetaMask) to use this demo."
      : shortErrorMessage(connectError)
    : null;

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points farming demo</CardTitle>
          <CardDescription>Connect a wallet on your local Anvil node to farm points manually.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={() => connect({ connector: injectedConnector })} disabled={isConnecting}>
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </Button>
          {connectErrorMessage && <p className="text-xs text-destructive">{connectErrorMessage}</p>}
        </CardContent>
      </Card>
    );
  }

  if (!onFoundry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points farming demo</CardTitle>
          <CardDescription>This demo runs against a local Anvil node (chain id {foundry.id}), not your currently connected network.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => switchChain({ chainId: foundry.id })} disabled={isSwitching}>
            {isSwitching ? "Switching…" : "Switch to Anvil Local"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points farming demo</CardTitle>
        <CardDescription>
          Check in and complete tasks to accumulate points, same mechanic the bot script in <code>bot/</code> automates
          across several test wallets. Points convert to an airdrop amount via a diminishing-returns curve
          (roughly √points), so farming more doesn't proportionally win more.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="text-2xl font-semibold">{points === undefined ? "…" : String(points)} points</div>

        <div className="flex flex-col gap-1">
          <Button onClick={handleCheckIn} disabled={isBusy || onCooldown}>
            {pendingAction === "checkIn" && isBusy ? "Checking in…" : "Check In"}
          </Button>
          {onCooldown && (
            <span className="text-xs text-muted-foreground">Next check-in available at {new Date(nextCheckInTime * 1000).toLocaleString()}.</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Tasks</span>
          <div className="flex flex-wrap gap-2">
            {TASK_IDS.map((taskId, i) => {
              const done = Boolean(completedTasks?.[i]?.result);
              const isThisPending = typeof pendingAction === "object" && pendingAction?.taskId === taskId && isBusy;
              return (
                <Button key={taskId} variant={done ? "secondary" : "outline"} size="sm" disabled={done || isBusy} onClick={() => handleCompleteTask(taskId)}>
                  {done ? `Task ${taskId} ✓` : isThisPending ? "Completing…" : `Complete Task ${taskId}`}
                </Button>
              );
            })}
          </div>
        </div>

        {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
      </CardContent>
    </Card>
  );
}
