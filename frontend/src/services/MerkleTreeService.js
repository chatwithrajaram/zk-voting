import { ethers } from 'ethers';

/**
 * MerkleTree Service - Handles Merkle tree construction and proof generation
 * 
 * The Merkle tree is used to:
 * 1. Create a cryptographic commitment to the list of eligible voters
 * 2. Allow voters to prove membership without revealing their identity
 * 3. Detect tampering - if anyone alters the voter list, the root changes
 */
class MerkleTreeService {
  constructor() {
    this.leaves = [];
    this.layers = [];
    this.root = null;
  }

  /**
   * Build Merkle tree from array of commitments (voter public keys)
   * @param {string[]} commitments - Array of commitment hashes (bytes32 hex strings)
   * @returns {string} Merkle root hash
   */
  buildTree(commitments) {
    if (!commitments || commitments.length === 0) {
      this.root = ethers.ZeroHash;
      this.leaves = [];
      this.layers = [];
      return this.root;
    }

    // Sort commitments for consistent tree structure
    this.leaves = [...commitments].sort((a, b) => {
      const aBig = BigInt(a);
      const bBig = BigInt(b);
      if (aBig < bBig) return -1;
      if (aBig > bBig) return 1;
      return 0;
    });

    // Build tree layers
    this.layers = [this.leaves];
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        
        // Hash pair (sorted for consistency)
        const hash = this._hashPair(left, right);
        nextLayer.push(hash);
      }
      
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    this.root = currentLayer[0];
    return this.root;
  }

  /**
   * Generate Merkle proof for a commitment
   * @param {string} commitment - The commitment to prove membership for
   * @returns {string[]} Array of sibling hashes forming the proof
   */
  getProof(commitment) {
    if (!this.root || this.leaves.length === 0) {
      return [];
    }

    const index = this.leaves.indexOf(commitment);
    if (index === -1) {
      throw new Error('Commitment not found in tree');
    }

    const proof = [];
    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Verify a Merkle proof
   * @param {string} commitment - The commitment (leaf) to verify
   * @param {string[]} proof - Array of sibling hashes
   * @param {string} root - Expected Merkle root
   * @returns {boolean} True if proof is valid
   */
  verifyProof(commitment, proof, root) {
    let computedHash = commitment;

    for (const proofElement of proof) {
      computedHash = this._hashPair(computedHash, proofElement);
    }

    return computedHash.toLowerCase() === root.toLowerCase();
  }

  /**
   * Hash a pair of nodes (sorted for consistency)
   * @param {string} a - First hash
   * @param {string} b - Second hash
   * @returns {string} Combined hash
   */
  _hashPair(a, b) {
    // Sort to ensure consistent hashing regardless of order
    const [left, right] = BigInt(a) <= BigInt(b) ? [a, b] : [b, a];
    return ethers.keccak256(ethers.concat([left, right]));
  }

  /**
   * Get current Merkle root
   * @returns {string} Merkle root hash
   */
  getRoot() {
    return this.root || ethers.ZeroHash;
  }

  /**
   * Get tree depth
   * @returns {number} Number of layers in the tree
   */
  getDepth() {
    return this.layers.length;
  }

  /**
   * Get number of leaves (voters)
   * @returns {number} Number of commitments in tree
   */
  getLeafCount() {
    return this.leaves.length;
  }

  /**
   * Check if a commitment is in the tree
   * @param {string} commitment - Commitment to check
   * @returns {boolean} True if commitment is in tree
   */
  hasCommitment(commitment) {
    return this.leaves.includes(commitment);
  }

  /**
   * Get tree visualization (for debugging)
   * @returns {object} Tree structure
   */
  getTreeInfo() {
    return {
      root: this.root,
      depth: this.getDepth(),
      leafCount: this.getLeafCount(),
      leaves: this.leaves.map(l => l.slice(0, 10) + '...')
    };
  }
}

// Export singleton instance
export const merkleTreeService = new MerkleTreeService();
