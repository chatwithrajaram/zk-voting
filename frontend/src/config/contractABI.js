/**
 * ZKVoting Contract ABI
 * Includes Merkle tree support for voter list integrity verification
 */

export const ZK_VOTING_ABI = [
  // Admin Functions
  "function addCandidate(string memory _name) external",
  "function updateCandidate(uint256 _candidateId, string memory _newName) external",
  "function removeCandidate(uint256 _candidateId) external",
  "function registerCommitment(bytes32 _commitment) external",
  "function batchRegisterCommitments(bytes32[] calldata _commitments) external",
  "function setElectionStatus(bool _isActive) external",
  "function setElectionName(string memory _name) external",
  "function setElectionTime(uint256 _startTime, uint256 _endTime) external",
  "function updateMerkleRoot(bytes32 _newRoot) external",
  
  // Voting Functions
  "function vote(bytes32 _nullifier, uint256 _candidateId, bytes32 _commitment) external",
  "function voteWithProof(bytes32 _nullifier, uint256 _candidateId, bytes32 _commitment, bytes32[] calldata _merkleProof) external",
  
  // Merkle Tree Functions
  "function verifyMerkleProof(bytes32[] calldata _proof, bytes32 _root, bytes32 _leaf) external pure returns (bool)",
  "function getAllCommitments() external view returns (bytes32[] memory)",
  "function getMerkleRoot() external view returns (bytes32)",
  
  // View Functions
  "function admin() external view returns (address)",
  "function electionName() external view returns (string memory)",
  "function electionStartTime() external view returns (uint256)",
  "function electionEndTime() external view returns (uint256)",
  "function isElectionActive() external view returns (bool)",
  "function merkleRoot() external view returns (bytes32)",
  "function candidateCount() external view returns (uint256)",
  "function totalVotes() external view returns (uint256)",
  
  "function getCandidate(uint256 _candidateId) external view returns (uint256 id, string memory name, uint256 voteCount)",
  "function getAllCandidates() external view returns (uint256[] memory ids, string[] memory names, uint256[] memory voteCounts)",
  "function getElectionDetails() external view returns (tuple(string name, uint256 startTime, uint256 endTime, bool isActive, uint256 totalVotes, bytes32 merkleRoot))",
  "function isNullifierUsed(bytes32 _nullifier) external view returns (bool)",
  "function isCommitmentRegistered(bytes32 _commitment) external view returns (bool)",
  "function getRegisteredVoterCount() external view returns (uint256)",
  "function isVotingOpen() external view returns (bool)",
  
  // Events
  "event ElectionCreated(string name, uint256 startTime, uint256 endTime)",
  "event CandidateAdded(uint256 indexed candidateId, string name)",
  "event CandidateUpdated(uint256 indexed candidateId, string newName)",
  "event CandidateRemoved(uint256 indexed candidateId)",
  "event CommitmentRegistered(bytes32 indexed commitment)",
  "event VoteCast(uint256 indexed candidateId, bytes32 indexed nullifier)",
  "event ElectionStatusChanged(bool isActive)",
  "event ElectionTimeUpdated(uint256 startTime, uint256 endTime)",
  "event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot)"
];
