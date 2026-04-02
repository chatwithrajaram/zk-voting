import React, { useState } from 'react';
import { web3Service } from '../services/Web3Service';
import { identityService } from '../services/IdentityService';

/**
 * VotingPanel Component - Candidate selection and vote submission
 */
function VotingPanel({ candidates, identity, election, onVoteSuccess }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voteStatus, setVoteStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const canVote = () => {
    if (!identity) return false;
    if (!election?.isActive) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return now >= election.startTime && now <= election.endTime;
  };

  const handleVote = async () => {
    if (!selectedCandidate || !identity) return;
    
    setLoading(true);
    setVoteStatus(null);
    
    try {
      // Check if commitment is registered
      const isRegistered = await web3Service.isCommitmentRegistered(identity.commitmentHex);
      if (!isRegistered) {
        throw new Error('Your identity is not registered. Contact the admin.');
      }

      // Generate nullifier
      const nullifier = identityService.generateNullifier(election.name);
      
      // Check if already voted
      const hasVoted = await web3Service.isNullifierUsed(nullifier);
      if (hasVoted) {
        throw new Error('You have already voted in this election.');
      }

      // Submit vote
      const result = await web3Service.vote(
        nullifier,
        selectedCandidate,
        identity.commitmentHex
      );

      setTxHash(result.txHash);
      setVoteStatus('success');
      setSelectedCandidate(null);
      
      // Refresh data
      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (err) {
      console.error('Vote failed:', err);
      setVoteStatus('error');
      setTxHash(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel voting-panel">
      <h3>🗳️ Cast Your Vote</h3>
      
      {!identity && (
        <div className="warning-message">
          Please generate an identity first to vote.
        </div>
      )}
      
      {identity && !canVote() && (
        <div className="warning-message">
          {!election?.isActive 
            ? 'Election is currently deactivated by admin.' 
            : 'Voting is not open. Check election time window.'}
        </div>
      )}

      <div className="candidates-list">
        {candidates.map((candidate) => (
          <div 
            key={candidate.id}
            className={`candidate-card ${selectedCandidate === candidate.id ? 'selected' : ''}`}
            onClick={() => canVote() && setSelectedCandidate(candidate.id)}
          >
            <div className="candidate-info">
              <span className="candidate-id">#{candidate.id}</span>
              <span className="candidate-name">{candidate.name}</span>
            </div>
            <div className="candidate-select">
              {selectedCandidate === candidate.id && (
                <span className="check-icon">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {voteStatus === 'success' && (
        <div className="success-message">
          <p>✅ Vote submitted successfully!</p>
          <p className="tx-hash">Transaction: {txHash?.slice(0, 20)}...</p>
        </div>
      )}

      {voteStatus === 'error' && (
        <div className="error-message">
          <p>❌ Vote failed</p>
          <p className="error-detail">{txHash}</p>
        </div>
      )}

      <button 
        className="btn btn-primary btn-lg vote-btn"
        onClick={handleVote}
        disabled={!selectedCandidate || !canVote() || loading}
      >
        {loading ? 'Submitting Vote...' : 'Submit Vote'}
      </button>

      <p className="privacy-note">
        🔒 Your vote is anonymous. Only the nullifier is recorded on-chain.
      </p>
    </div>
  );
}

export default VotingPanel;
