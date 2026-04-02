import { Identity } from '@semaphore-protocol/identity';
import { ethers } from 'ethers';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Identity Service - Handles ZKP identity management
 */
class IdentityService {
  constructor() {
    this.identity = null;
  }

  /**
   * Generate a new Semaphore identity from Aadhaar number
   * @param {string} aadhaarNumber - 12-digit Aadhaar number
   */
  generateIdentity(aadhaarNumber) {
    try {
      const cleanedAadhaar = aadhaarNumber.replace(/\s/g, '');
      
      if (!cleanedAadhaar || cleanedAadhaar.length !== 12 || !/^\d{12}$/.test(cleanedAadhaar)) {
        throw new Error('Invalid Aadhaar number. Must be exactly 12 digits.');
      }

      // Create deterministic identity from Aadhaar
      // Same Aadhaar will always generate the same identity/commitment
      const seed = ethers.keccak256(ethers.toUtf8Bytes(cleanedAadhaar));
      this.identity = new Identity(seed);
      
      // Store identity secret for recovery (but NOT the Aadhaar for privacy)
      localStorage.setItem(STORAGE_KEYS.IDENTITY, this.identity.toString());
      
      return {
        commitment: this.identity.commitment.toString(),
        commitmentHex: this._toBytes32(this.identity.commitment)
      };
    } catch (error) {
      console.error('Failed to generate identity:', error);
      throw new Error('Identity generation failed: ' + error.message);
    }
  }

  /**
   * Restore identity from local storage
   */
  restoreIdentity() {
    try {
      const storedIdentity = localStorage.getItem(STORAGE_KEYS.IDENTITY);
      
      if (!storedIdentity) {
        return null;
      }

      this.identity = new Identity(storedIdentity);
      
      return {
        commitment: this.identity.commitment.toString(),
        commitmentHex: this._toBytes32(this.identity.commitment)
      };
    } catch (error) {
      console.error('Failed to restore identity:', error);
      localStorage.removeItem(STORAGE_KEYS.IDENTITY);
      return null;
    }
  }

  /**
   * Check if identity exists
   */
  hasIdentity() {
    return !!localStorage.getItem(STORAGE_KEYS.IDENTITY);
  }

  /**
   * Get current identity commitment
   */
  getCommitment() {
    if (!this.identity) {
      this.restoreIdentity();
    }
    
    if (!this.identity) {
      return null;
    }

    return {
      commitment: this.identity.commitment.toString(),
      commitmentHex: this._toBytes32(this.identity.commitment)
    };
  }

  /**
   * Generate nullifier for voting
   * @param {string} externalNullifier - Election identifier
   */
  generateNullifier(externalNullifier) {
    if (!this.identity) {
      throw new Error('No identity found');
    }

    // Generate deterministic nullifier from identity and election
    const nullifierHash = ethers.keccak256(
      ethers.solidityPacked(
        ['uint256', 'string'],
        [this.identity.nullifier, externalNullifier]
      )
    );

    return nullifierHash;
  }

  /**
   * Clear stored identity
   */
  clearIdentity() {
    localStorage.removeItem(STORAGE_KEYS.IDENTITY);
    this.identity = null;
  }

  /**
   * Export identity for backup
   */
  exportIdentity() {
    const storedIdentity = localStorage.getItem(STORAGE_KEYS.IDENTITY);
    if (!storedIdentity) {
      throw new Error('No identity to export');
    }
    return storedIdentity;
  }

  /**
   * Import identity from backup
   */
  importIdentity(identityString) {
    try {
      const identity = new Identity(identityString);
      localStorage.setItem(STORAGE_KEYS.IDENTITY, identityString);
      this.identity = identity;
      
      return {
        commitment: identity.commitment.toString(),
        commitmentHex: this._toBytes32(identity.commitment)
      };
    } catch (error) {
      throw new Error('Invalid identity string');
    }
  }

  /**
   * Convert bigint to bytes32 hex string
   */
  _toBytes32(value) {
    return ethers.zeroPadValue(ethers.toBeHex(value), 32);
  }
}

// Export singleton instance
export const identityService = new IdentityService();
