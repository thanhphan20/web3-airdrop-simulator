import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";

const eligibility = JSON.parse(fs.readFileSync(new URL("./eligibility.json", import.meta.url)));
const values = eligibility.map((e) => [e.address, e.amount]);

const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

fs.mkdirSync(new URL("./output/", import.meta.url), { recursive: true });

fs.writeFileSync(
  new URL("./output/merkle-root.json", import.meta.url),
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
fs.writeFileSync(new URL("./output/merkle-proofs.json", import.meta.url), JSON.stringify(proofs, null, 2));

console.log("Merkle root:", tree.root);
console.log("Entries:", values.length);
