import { keccak256, toUtf8Bytes } from "ethers";
import { MerkleTree } from "merkletreejs";

export function buildSerialTree(serials: string[]): MerkleTree {
  const leaves = serials.map((s) =>
    Buffer.from(keccak256(toUtf8Bytes(s)).slice(2), "hex")
  );
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

export function getRoot(tree: MerkleTree): string {
  return tree.getHexRoot();
}

export function getLeaf(serial: string): string {
  return keccak256(toUtf8Bytes(serial));
}

export function getProof(tree: MerkleTree, serial: string): string[] {
  const leaf = Buffer.from(
    keccak256(toUtf8Bytes(serial)).slice(2),
    "hex"
  );
  return tree.getHexProof(leaf);
}

export function verifyLocally(tree: MerkleTree, serial: string): boolean {
  const leaf = Buffer.from(
    keccak256(toUtf8Bytes(serial)).slice(2),
    "hex"
  );
  return tree.verify(tree.getProof(leaf), leaf, tree.getRoot());
}
