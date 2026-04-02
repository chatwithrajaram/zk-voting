// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZKVoting
 * @author MTech Project
 * @notice Privacy-preserving voting contract using Zero-Knowledge Proofs and Merkle Tree
 * @dev Implements anonymous voting with nullifier-based double-vote prevention
 *      and Merkle tree for voter list integrity verification
 */
contract ZKVoting {
    // ============ State Variables ============
    
    address public admin;
    string public electionName;
    uint256 public electionStartTime;
    uint256 public electionEndTime;
    bool public isElectionActive;
    
    // Merkle Tree Root - hash of all eligible voter commitments
    // Used to verify voter list integrity and membership
    bytes32 public merkleRoot;
    
    // ============ Structs ============
    
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        bool exists;
    }
    
    struct Election {
        string name;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
        bytes32 merkleRoot;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => Candidate) public candidates;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(bytes32 => bool) public registeredCommitments;
    
    uint256 public candidateCount;
    uint256 public totalVotes;
    bytes32[] public commitmentList;
    
    // ============ Events ============
    
    event ElectionCreated(string name, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event CandidateUpdated(uint256 indexed candidateId, string newName);
    event CandidateRemoved(uint256 indexed candidateId);
    event CommitmentRegistered(bytes32 indexed commitment);
    event VoteCast(uint256 indexed candidateId, bytes32 indexed nullifier);
    event ElectionStatusChanged(bool isActive);
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event ElectionTimeUpdated(uint256 startTime, uint256 endTime);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "ZKVoting: caller is not admin");
        _;
    }
    
    modifier electionActive() {
        require(isElectionActive, "ZKVoting: election is not active");
        require(block.timestamp >= electionStartTime, "ZKVoting: election has not started");
        require(block.timestamp <= electionEndTime, "ZKVoting: election has ended");
        _;
    }
    
    modifier validCandidate(uint256 _candidateId) {
        require(candidates[_candidateId].exists, "ZKVoting: invalid candidate");
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Deploy a new election with Merkle tree support
     * @param _electionName Name/title of the election
     * @param _startTime Unix timestamp when voting starts
     * @param _endTime Unix timestamp when voting ends
     */
    constructor(string memory _electionName, uint256 _startTime, uint256 _endTime) {
        require(_startTime < _endTime, "ZKVoting: invalid time range");
        require(_endTime > block.timestamp, "ZKVoting: end time must be in future");
        
        admin = msg.sender;
        electionName = _electionName;
        electionStartTime = _startTime;
        electionEndTime = _endTime;
        isElectionActive = true;
        merkleRoot = bytes32(0); // Initially empty, updated when voters are registered
        
        emit ElectionCreated(_electionName, _startTime, _endTime);
    }

    
    // ============ Admin Functions ============
    
    /**
     * @notice Add a new candidate to the election
     * @param _name Name of the candidate
     */
    function addCandidate(string memory _name) external onlyAdmin {
        require(bytes(_name).length > 0, "ZKVoting: empty candidate name");
        require(block.timestamp < electionStartTime, "ZKVoting: cannot add after election starts");
        
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            voteCount: 0,
            exists: true
        });
        
        emit CandidateAdded(candidateCount, _name);
    }

    /**
     * @notice Update an existing candidate's name
     * @param _candidateId ID of the candidate to update
     * @param _newName New name for the candidate
     */
    function updateCandidate(uint256 _candidateId, string memory _newName) external onlyAdmin {
        require(candidates[_candidateId].exists, "ZKVoting: candidate does not exist");
        require(bytes(_newName).length > 0, "ZKVoting: empty candidate name");
        require(!isElectionActive || totalVotes == 0, "ZKVoting: cannot update during active voting");
        
        candidates[_candidateId].name = _newName;
        
        emit CandidateUpdated(_candidateId, _newName);
    }

    /**
     * @notice Remove a candidate from the election
     * @param _candidateId ID of the candidate to remove
     */
    function removeCandidate(uint256 _candidateId) external onlyAdmin {
        require(candidates[_candidateId].exists, "ZKVoting: candidate does not exist");
        require(!isElectionActive || totalVotes == 0, "ZKVoting: cannot remove during active voting");
        
        candidates[_candidateId].exists = false;
        
        emit CandidateRemoved(_candidateId);
    }
    
    /**
     * @notice Register a voter's identity commitment
     * @param _commitment The identity commitment hash (public key derived from Aadhaar)
     * @dev After registering, admin should call updateMerkleRoot with new root
     */
    function registerCommitment(bytes32 _commitment) external onlyAdmin {
        require(_commitment != bytes32(0), "ZKVoting: invalid commitment");
        require(!registeredCommitments[_commitment], "ZKVoting: commitment already registered");
        
        registeredCommitments[_commitment] = true;
        commitmentList.push(_commitment);
        
        emit CommitmentRegistered(_commitment);
    }
    
    /**
     * @notice Batch register multiple commitments
     * @param _commitments Array of identity commitments
     * @dev After batch registration, admin should call updateMerkleRoot with new root
     */
    function batchRegisterCommitments(bytes32[] calldata _commitments) external onlyAdmin {
        for (uint256 i = 0; i < _commitments.length; i++) {
            if (_commitments[i] != bytes32(0) && !registeredCommitments[_commitments[i]]) {
                registeredCommitments[_commitments[i]] = true;
                commitmentList.push(_commitments[i]);
                emit CommitmentRegistered(_commitments[i]);
            }
        }
    }
    
    /**
     * @notice Update the Merkle tree root after voter registration changes
     * @param _newRoot New Merkle root computed from all registered commitments
     * @dev The Merkle root is a hash derived from all participants' public keys (commitments)
     *      using Pedersen-like commitment. It serves two purposes:
     *      1. Verifying voter identity (membership proof)
     *      2. Safeguarding against tampering - if anyone alters the eligible participants' 
     *         list, the hash won't match the stored Merkle tree root
     */
    function updateMerkleRoot(bytes32 _newRoot) external onlyAdmin {
        require(_newRoot != bytes32(0), "ZKVoting: invalid merkle root");
        
        bytes32 oldRoot = merkleRoot;
        merkleRoot = _newRoot;
        
        emit MerkleRootUpdated(oldRoot, _newRoot);
    }
    
    /**
     * @notice Toggle election active status
     * @param _isActive New status
     */
    function setElectionStatus(bool _isActive) external onlyAdmin {
        isElectionActive = _isActive;
        emit ElectionStatusChanged(_isActive);
    }

    /**
     * @notice Update election name
     * @param _name New election name
     */
    function setElectionName(string memory _name) external onlyAdmin {
        require(bytes(_name).length > 0, "ZKVoting: empty election name");
        require(totalVotes == 0, "ZKVoting: cannot change after voting starts");
        electionName = _name;
    }

    /**
     * @notice Update election time window
     * @param _startTime New start time
     * @param _endTime New end time
     */
    function setElectionTime(uint256 _startTime, uint256 _endTime) external onlyAdmin {
        require(_startTime < _endTime, "ZKVoting: invalid time range");
        require(_endTime > block.timestamp, "ZKVoting: end time must be in future");
        require(totalVotes == 0, "ZKVoting: cannot change after voting starts");
        
        electionStartTime = _startTime;
        electionEndTime = _endTime;
        
        emit ElectionTimeUpdated(_startTime, _endTime);
    }
    
    // ============ Voting Functions ============
    
    /**
     * @notice Cast a vote using ZKP nullifier with Merkle proof verification
     * @param _nullifier Unique nullifier to prevent double voting
     * @param _candidateId ID of the candidate to vote for
     * @param _commitment Voter's identity commitment for verification
     * @param _merkleProof Array of sibling hashes for Merkle proof verification
     * @dev The Merkle proof verifies that the commitment is part of the registered voters
     *      without revealing which specific voter is casting the vote
     */
    function voteWithProof(
        bytes32 _nullifier,
        uint256 _candidateId,
        bytes32 _commitment,
        bytes32[] calldata _merkleProof
    ) external electionActive validCandidate(_candidateId) {
        require(_nullifier != bytes32(0), "ZKVoting: invalid nullifier");
        require(!usedNullifiers[_nullifier], "ZKVoting: vote already cast");
        require(registeredCommitments[_commitment], "ZKVoting: commitment not registered");
        
        // Verify Merkle proof if root is set
        if (merkleRoot != bytes32(0)) {
            require(
                verifyMerkleProof(_merkleProof, merkleRoot, _commitment),
                "ZKVoting: invalid merkle proof"
            );
        }
        
        usedNullifiers[_nullifier] = true;
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        emit VoteCast(_candidateId, _nullifier);
    }
    
    /**
     * @notice Cast a vote (backward compatible - no Merkle proof required)
     * @param _nullifier Unique nullifier to prevent double voting
     * @param _candidateId ID of the candidate to vote for
     * @param _commitment Voter's identity commitment for verification
     */
    function vote(
        bytes32 _nullifier,
        uint256 _candidateId,
        bytes32 _commitment
    ) external electionActive validCandidate(_candidateId) {
        require(_nullifier != bytes32(0), "ZKVoting: invalid nullifier");
        require(!usedNullifiers[_nullifier], "ZKVoting: vote already cast");
        require(registeredCommitments[_commitment], "ZKVoting: commitment not registered");
        
        usedNullifiers[_nullifier] = true;
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        emit VoteCast(_candidateId, _nullifier);
    }
    
    // ============ Merkle Tree Functions ============
    
    /**
     * @notice Verify a Merkle proof
     * @param _proof Array of sibling hashes
     * @param _root Merkle root to verify against
     * @param _leaf Leaf node (commitment) to verify
     * @return bool True if proof is valid
     * @dev Uses keccak256 for hashing. The proof verifies that _leaf is part of
     *      the tree with root _root without revealing the leaf's position
     */
    function verifyMerkleProof(
        bytes32[] calldata _proof,
        bytes32 _root,
        bytes32 _leaf
    ) public pure returns (bool) {
        bytes32 computedHash = _leaf;
        
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];
            
            // Sort the pair to ensure consistent hashing regardless of order
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == _root;
    }
    
    /**
     * @notice Get all registered commitments (for Merkle tree construction)
     * @return Array of all registered commitment hashes
     */
    function getAllCommitments() external view returns (bytes32[] memory) {
        return commitmentList;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get candidate details
     * @param _candidateId ID of the candidate
     */
    function getCandidate(uint256 _candidateId) external view returns (
        uint256 id,
        string memory name,
        uint256 voteCount
    ) {
        require(candidates[_candidateId].exists, "ZKVoting: invalid candidate");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }
    
    /**
     * @notice Get all active candidates with their vote counts
     */
    function getAllCandidates() external view returns (
        uint256[] memory ids,
        string[] memory names,
        uint256[] memory voteCounts
    ) {
        // First count active candidates
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].exists) {
                activeCount++;
            }
        }
        
        // Create arrays with correct size
        ids = new uint256[](activeCount);
        names = new string[](activeCount);
        voteCounts = new uint256[](activeCount);
        
        // Fill arrays with only active candidates
        uint256 index = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].exists) {
                ids[index] = candidates[i].id;
                names[index] = candidates[i].name;
                voteCounts[index] = candidates[i].voteCount;
                index++;
            }
        }
        
        return (ids, names, voteCounts);
    }
    
    /**
     * @notice Get election details including Merkle root
     */
    function getElectionDetails() external view returns (Election memory) {
        return Election({
            name: electionName,
            startTime: electionStartTime,
            endTime: electionEndTime,
            isActive: isElectionActive,
            totalVotes: totalVotes,
            merkleRoot: merkleRoot
        });
    }
    
    /**
     * @notice Check if a nullifier has been used
     * @param _nullifier The nullifier to check
     */
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return usedNullifiers[_nullifier];
    }
    
    /**
     * @notice Check if a commitment is registered
     * @param _commitment The commitment to check
     */
    function isCommitmentRegistered(bytes32 _commitment) external view returns (bool) {
        return registeredCommitments[_commitment];
    }
    
    /**
     * @notice Get total registered voters
     */
    function getRegisteredVoterCount() external view returns (uint256) {
        return commitmentList.length;
    }
    
    /**
     * @notice Check if election is currently in voting period
     */
    function isVotingOpen() external view returns (bool) {
        return isElectionActive && 
               block.timestamp >= electionStartTime && 
               block.timestamp <= electionEndTime;
    }
    
    /**
     * @notice Get current Merkle root
     * @return The Merkle root hash of all registered voter commitments
     */
    function getMerkleRoot() external view returns (bytes32) {
        return merkleRoot;
    }
}
