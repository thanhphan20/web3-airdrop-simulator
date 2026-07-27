import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

// --input/--output-dir let this same tree-building logic (StandardMerkleTree,
// double-hash leaf convention) be reused for a second eligibility list (e.g.
// the farming bot's output) without duplicating it. Defaults match the
// original behavior exactly, so `bun run generate` (no args) is unchanged.
const inputArg = argValue("--input");
const outputDirArg = argValue("--output-dir");

const inputPath = inputArg
  ? path.resolve(process.cwd(), inputArg)
  : fileURLToPath(new URL("./eligibility.json", import.meta.url));
const outputDir = outputDirArg
  ? path.resolve(process.cwd(), outputDirArg)
  : fileURLToPath(new URL("./output/", import.meta.url));

const eligibility = JSON.parse(fs.readFileSync(inputPath));
const values = eligibility.map((e) => [e.address, e.amount]);

const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(
  path.join(outputDir, "merkle-root.json"),
  JSON.stringify(
    {
      root: tree.root,
      tokenTotal: values.reduce((sum, v) => sum + BigInt(v[1]), 0n).toString(),
      decimals: 18,
    },
    null,
    2
  )
);

const proofs = {};
for (const [i, v] of tree.entries()) {
  proofs[v[0]] = { amount: v[1], proof: tree.getProof(i) };
}
fs.writeFileSync(path.join(outputDir, "merkle-proofs.json"), JSON.stringify(proofs, null, 2));

console.log("Merkle root:", tree.root);
console.log("Entries:", values.length);
