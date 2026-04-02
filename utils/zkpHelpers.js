const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const { generateProof, verifyProof } = require("@semaphore-protocol/proof");
const { ethers } = require("ethers");
const logger = require("./logger");

/**
 * ZKP Helper utilities for Semaphore integration
 */

/**
 * Generate a new Semaphore identity
 * @returns {Object} Identity object with commitment
 */
function generateIdentity() {
  try {
    const identity = new Identity();
    logger.info("Identity generated", { 
      commitment: identity.commitment.toString() 
    });
    
    return {
      identity,
      commitment: identity.commitment,
      trapdoor: identity.trapdoor,
      nullifier: identity.nullifier
    };
  } catch (error) {
    logger.error("Failed to generate identity", { error: error.message });
    throw error;
  }
}

/**
 * Restore identity from secret string
 * @param {string} secret - Secret string to restore identity
 * @returns {Object} Identity object
 */
function restoreIdentity(secret) {
  try {
    const identity = new Identity(secret);
    logger.info("Identity restored", { 
      commitment: identity.commitment.toString() 
    });
    return {
      identity,
      commitment: identity.commitment
    };
  } catch (error) {
    logger.error("Failed to restore identity", { error: error.message });
    throw error;
  }
}

/**
 * Create a Semaphore group with members
 * @param {number} groupId - Group identifier
 * @param {Array<bigint>} members - Array of identity commitments
 * @returns {Group} Semaphore group
 */
function createGroup(groupId, members = []) {
  try {
    const group = new Group(groupId, 20); // Tree depth of 20
    
    for (const member of members) {
      group.addMember(member);
    }
    
    logger.info("Group created", { 
      groupId, 
      memberCount: members.length,
      root: group.root.toString()
    });
    
    return group;
  } catch (error) {
    logger.error("Failed to create group", { error: error.message });
    throw error;
  }
}

/**
 * Generate a ZK proof for voting
 * @param {Identity} identity - Voter's identity
 * @param {Group} group - Semaphore group
 * @param {string} signal - Vote signal (candidate ID)
 * @param {string} externalNullifier - External nullifier (election ID)
 * @returns {Object} Proof data
 */
async function generateVoteProof(identity, group, signal, externalNullifier) {
  try {
    logger.info("Generating vote proof", { signal, externalNullifier });
    
    const proof = await generateProof(
      identity,
      group,
      externalNullifier,
      signal
    );
    
    logger.info("Vote proof generated", { 
      nullifierHash: proof.nullifierHash.toString() 
    });
    
    return proof;
  } catch (error) {
    logger.error("Failed to generate vote proof", { error: error.message });
    throw error;
  }
}

/**
 * Verify a ZK proof
 * @param {Object} proof - Proof to verify
 * @returns {boolean} Verification result
 */
async function verifyVoteProof(proof) {
  try {
    const isValid = await verifyProof(proof);
    logger.info("Proof verification", { isValid });
    return isValid;
  } catch (error) {
    logger.error("Failed to verify proof", { error: error.message });
    throw error;
  }
}

/**
 * Generate nullifier hash for a vote
 * @param {string} identityNullifier - Identity nullifier
 * @param {string} externalNullifier - External nullifier (election ID)
 * @returns {string} Nullifier hash
 */
function generateNullifierHash(identityNullifier, externalNullifier) {
  const hash = ethers.keccak256(
    ethers.solidityPacked(
      ["uint256", "uint256"],
      [identityNullifier, externalNullifier]
    )
  );
  return hash;
}

/**
 * Convert commitment to bytes32 format
 * @param {bigint} commitment - Identity commitment
 * @returns {string} Bytes32 formatted commitment
 */
function commitmentToBytes32(commitment) {
  return ethers.zeroPadValue(ethers.toBeHex(commitment), 32);
}

module.exports = {
  generateIdentity,
  restoreIdentity,
  createGroup,
  generateVoteProof,
  verifyVoteProof,
  generateNullifierHash,
  commitmentToBytes32
};
