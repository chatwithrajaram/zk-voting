import { ethers } from 'ethers';
import { ZK_VOTING_ABI } from '../config/contractABI';
import { CONFIG, NETWORK_CONFIG } from '../config/constants';
import { merkleTreeService } from './MerkleTreeService';

/**
 * Web3 Service - Handles all blockchain interactions
 */
class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connect() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      this.account = accounts[0];
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Log connection info for debugging
      const network = await this.provider.getNetwork();
      console.log('Connected to network:', network.chainId.toString());
      console.log('Contract address:', CONFIG.CONTRACT_ADDRESS);
      
      // Verify contract exists
      const code = await this.provider.getCode(CONFIG.CONTRACT_ADDRESS);
      console.log('Contract code length:', code.length);
      if (code === '0x') {
        throw new Error(`No contract found at ${CONFIG.CONTRACT_ADDRESS}. Make sure you're on the correct network and the contract is deployed.`);
      }
      
      // Initialize contract
      if (CONFIG.CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(
          CONFIG.CONTRACT_ADDRESS,
          ZK_VOTING_ABI,
          this.signer
        );
      }

      // Setup event listeners
      this._setupEventListeners();

      return {
        account: this.account,
        network: await this.getNetwork()
      };
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  /**
   * Setup MetaMask event listeners
   */
  _setupEventListeners() {
    window.ethereum.on('accountsChanged', (accounts) => {
      this.account = accounts[0] || null;
      window.location.reload();
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }

  /**
   * Get current network info
   */
  async getNetwork() {
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);
    return {
      chainId,
      name: NETWORK_CONFIG[chainId]?.name || 'Unknown'
    };
  }

  /**
   * Switch to correct network
   */
  async switchNetwork() {
    const targetNetwork = NETWORK_CONFIG[CONFIG.NETWORK_ID];
    if (!targetNetwork) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }]
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetNetwork.chainId,
            chainName: targetNetwork.name,
            rpcUrls: [targetNetwork.rpcUrl]
          }]
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Get election details
   */
  async getElectionDetails() {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const details = await this.contract.getElectionDetails();
    return {
      name: details.name,
      startTime: Number(details.startTime),
      endTime: Number(details.endTime),
      isActive: details.isActive,
      totalVotes: Number(details.totalVotes),
      merkleRoot: details.merkleRoot
    };
  }

  /**
   * Get all candidates
   */
  async getCandidates() {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const [ids, names, voteCounts] = await this.contract.getAllCandidates();
    return ids.map((id, index) => ({
      id: Number(id),
      name: names[index],
      voteCount: Number(voteCounts[index])
    }));
  }

  /**
   * Check if voting is open
   */
  async isVotingOpen() {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.isVotingOpen();
  }

  /**
   * Check if commitment is registered
   */
  async isCommitmentRegistered(commitment) {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.isCommitmentRegistered(commitment);
  }

  /**
   * Check if nullifier is used
   */
  async isNullifierUsed(nullifier) {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.isNullifierUsed(nullifier);
  }

  /**
   * Cast a vote
   */
  async vote(nullifier, candidateId, commitment) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.vote(nullifier, candidateId, commitment);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  /**
   * Cast a vote with Merkle proof verification
   */
  async voteWithProof(nullifier, candidateId, commitment, merkleProof) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.voteWithProof(nullifier, candidateId, commitment, merkleProof);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  /**
   * Register commitment (admin only)
   */
  async registerCommitment(commitment) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.registerCommitment(commitment);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Add candidate (admin only)
   */
  async addCandidate(name) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.addCandidate(name);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Update candidate name (admin only)
   */
  async updateCandidate(candidateId, newName) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.updateCandidate(candidateId, newName);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Remove candidate (admin only)
   */
  async removeCandidate(candidateId) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.removeCandidate(candidateId);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Update election name (admin only)
   */
  async setElectionName(name) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.setElectionName(name);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Update election time window (admin only)
   */
  async setElectionTime(startTime, endTime) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.setElectionTime(startTime, endTime);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Toggle election status (admin only)
   */
  async setElectionStatus(isActive) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.setElectionStatus(isActive);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Check if current account is admin
   */
  async isAdmin() {
    if (!this.contract || !this.account) return false;
    const admin = await this.contract.admin();
    return admin.toLowerCase() === this.account.toLowerCase();
  }

  /**
   * Get registered voter count
   */
  async getRegisteredVoterCount() {
    if (!this.contract) throw new Error('Contract not initialized');
    return Number(await this.contract.getRegisteredVoterCount());
  }

  /**
   * Get all registered commitments (for Merkle tree construction)
   */
  async getAllCommitments() {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.getAllCommitments();
  }

  /**
   * Update Merkle root (admin only)
   * @param {string} newRoot - New Merkle root hash
   */
  async updateMerkleRoot(newRoot) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const tx = await this.contract.updateMerkleRoot(newRoot);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Get current Merkle root
   */
  async getMerkleRoot() {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.getMerkleRoot();
  }

  /**
   * Build Merkle tree from on-chain commitments and update root
   * @returns {object} Tree info including root
   */
  async rebuildAndUpdateMerkleTree() {
    const commitments = await this.getAllCommitments();
    const root = merkleTreeService.buildTree(commitments);
    
    // Update on-chain if root changed
    const currentRoot = await this.getMerkleRoot();
    if (root !== currentRoot) {
      await this.updateMerkleRoot(root);
    }
    
    return {
      root,
      leafCount: merkleTreeService.getLeafCount(),
      depth: merkleTreeService.getDepth()
    };
  }

  /**
   * Get Merkle proof for a commitment
   * @param {string} commitment - Voter's commitment
   */
  async getMerkleProof(commitment) {
    // Ensure tree is built with latest commitments
    const commitments = await this.getAllCommitments();
    merkleTreeService.buildTree(commitments);
    
    return merkleTreeService.getProof(commitment);
  }

  /**
   * Verify Merkle proof locally
   */
  verifyMerkleProof(commitment, proof, root) {
    return merkleTreeService.verifyProof(commitment, proof, root);
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
