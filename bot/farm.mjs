import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import fs from "fs";
import path from "path";

import pointsArtifact from "../out/PointsProtocol.sol/PointsProtocol.json" with { type: "json" };

const RPC_URL = "http://127.0.0.1:8545";
const ROUNDS = 30; // 30 simulated "days"
const DAY_SECONDS = 86400;
const SCALE = 5; // diminishing-returns: tokens = floor(sqrt(points) * SCALE)

const POINTS_ADDRESS = process.env.POINTS_ADDRESS;
if (!POINTS_ADDRESS) {
  throw new Error("Set POINTS_ADDRESS to the deployed PointsProtocol address before running `bun run farm`.");
}

// Anvil's well-known default test accounts #0-#5 (same addresses used in
// merkle/eligibility.json). Verified against a real local `anvil` console
// run, not trusted from memory: a wrong key still gets funded (Anvil funds
// by account index), but silently signs from the wrong address, breaking
// the "same addresses as eligibility.json" property with no error thrown.
const WALLETS = [
  { key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", label: "heavy", checkInEvery: 1, taskIds: [0, 1, 2, 3, 4] },
  { key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", label: "heavy-medium", checkInEvery: 1, taskIds: [0, 1, 2] },
  { key: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", label: "medium", checkInEvery: 2, taskIds: [0, 1] },
  { key: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", label: "medium-light", checkInEvery: 3, taskIds: [0] },
  { key: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", label: "light", checkInEvery: 5, taskIds: [] },
  { key: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", label: "minimal", checkInEvery: 10, taskIds: [0] },
];

const abi = pointsArtifact.abi;

const publicClient = createPublicClient({ chain: foundry, transport: http(RPC_URL) });

const clients = WALLETS.map((w) => {
  const account = privateKeyToAccount(w.key);
  return {
    ...w,
    account,
    wallet: createWalletClient({ account, chain: foundry, transport: http(RPC_URL) }),
  };
});

async function timeTravel(seconds) {
  await publicClient.request({ method: "evm_increaseTime", params: [seconds] });
  await publicClient.request({ method: "evm_mine", params: [] });
}

async function writeAndWait(client, functionName, args = []) {
  const hash = await client.wallet.writeContract({
    address: POINTS_ADDRESS,
    abi,
    functionName,
    args,
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

console.log(`Farming against PointsProtocol at ${POINTS_ADDRESS} for ${ROUNDS} simulated days...`);

for (let round = 0; round < ROUNDS; round++) {
  for (const client of clients) {
    if (round % client.checkInEvery === 0) {
      await writeAndWait(client, "checkIn");
    }
    if (round === 0) {
      for (const taskId of client.taskIds) {
        await writeAndWait(client, "completeTask", [taskId]);
      }
    }
  }
  await timeTravel(DAY_SECONDS);
}

console.log("Farming complete. Final point tallies:");

const entries = [];
for (const client of clients) {
  const pts = await publicClient.readContract({
    address: POINTS_ADDRESS,
    abi,
    functionName: "points",
    args: [client.account.address],
  });

  const points = Number(pts);
  const tokens = Math.floor(Math.sqrt(points) * SCALE);
  console.log(`  ${client.label.padEnd(13)} ${client.account.address}  ${points} points -> ${tokens} tokens`);

  if (points > 0) {
    entries.push({ address: client.account.address, amount: (BigInt(tokens) * 10n ** 18n).toString() });
  }
}

const outDir = path.resolve(import.meta.dirname, "output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "points-eligibility.json");
fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));
console.log(`Wrote ${outPath}`);
