import React, { useState, useEffect } from 'react';
import { web3Service } from '../services/Web3Service';
import { merkleTreeService } from '../services/MerkleTreeService';

/**
 * AdminPanel Component - Admin controls with Merkle tree support
 */
function AdminPanel({ onUpdate, election, candidates }) {
  const [activeSection, setActiveSection] = useState('voters');
  const [candidateName, setCandidateName] = useState('');
  const [commitment, setCommitment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [voterCount, setVoterCount] = useState(0);
  const [merkleInfo, setMerkleInfo] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadVoterCount();
    loadMerkleInfo();
    if (election) {
      if (election.startTime) {
        const start = new Date(election.startTime * 1000);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
      }
      if (election.endTime) {
        const end = new Date(election.endTime * 1000);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      }
    }
  }, [election]);

  const loadVoterCount = async () => {
    try {
      const count = await web3Service.getRegisteredVoterCount();
      setVoterCount(count);
    } catch (err) {
      console.error('Failed to load voter count:', err);
    }
  };

  const loadMerkleInfo = async () => {
    try {
      const commitments = await web3Service.getAllCommitments();
      const root = merkleTreeService.buildTree(commitments);
      const onChainRoot = await web3Service.getMerkleRoot();
      
      setMerkleInfo({
        localRoot: root,
        onChainRoot: onChainRoot,
        leafCount: merkleTreeService.getLeafCount(),
        depth: merkleTreeService.getDepth(),
        isSynced: root.toLowerCase() === onChainRoot.toLowerCase()
      });
    } catch (err) {
      console.error('Failed to load Merkle info:', err);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!candidateName.trim()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await web3Service.addCandidate(candidateName);
      setMessage({ type: 'success', text: `Candidate "${candidateName}" added!` });
      setCandidateName('');
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add candidate' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate.id);
    setEditName(candidate.name);
  };

  const handleSaveEdit = async (candidateId) => {
    if (!editName.trim()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await web3Service.updateCandidate(candidateId, editName);
      setMessage({ type: 'success', text: 'Candidate updated!' });
      setEditingCandidate(null);
      setEditName('');
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update candidate' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCandidate(null);
    setEditName('');
  };

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!window.confirm(`Are you sure you want to remove "${candidateName}"?`)) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await web3Service.removeCandidate(candidateId);
      setMessage({ type: 'success', text: `Candidate "${candidateName}" removed!` });
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove candidate' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCommitment = async (e) => {
    e.preventDefault();
    if (!commitment.trim()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      if (!commitment.startsWith('0x') || commitment.length !== 66) {
        throw new Error('Invalid commitment format. Must be a 32-byte hex string.');
      }
      
      await web3Service.registerCommitment(commitment);
      
      // Auto-update Merkle root after registration
      const result = await web3Service.rebuildAndUpdateMerkleTree();
      
      setMessage({ type: 'success', text: `Voter registered! Merkle root updated (${result.leafCount} voters).` });
      setCommitment('');
      loadVoterCount();
      loadMerkleInfo();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to register' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMerkleRoot = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await web3Service.rebuildAndUpdateMerkleTree();
      setMessage({ 
        type: 'success', 
        text: `Merkle root updated! ${result.leafCount} voters in tree.` 
      });
      loadMerkleInfo();
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update Merkle root' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleElection = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const newStatus = !election?.isActive;
      await web3Service.setElectionStatus(newStatus);
      setMessage({ type: 'success', text: `Election ${newStatus ? 'activated' : 'paused'}!` });
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateElectionTime = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const startTimestamp = Math.floor(new Date(`${startDate}T${startTime}`).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000);
      
      if (startTimestamp >= endTimestamp) {
        throw new Error('End time must be after start time');
      }
      
      await web3Service.setElectionTime(startTimestamp, endTimestamp);
      setMessage({ type: 'success', text: 'Election time updated!' });
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update time' });
    } finally {
      setLoading(false);
    }
  };

  const formatRoot = (root) => {
    if (!root || root === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return 'Not set';
    }
    return `${root.slice(0, 10)}...${root.slice(-8)}`;
  };

  const canModifyCandidates = !election?.isActive || election?.totalVotes === 0;

  return (
    <div className="panel admin-panel">
      <div className="admin-header">
        <h3>⚙️ Admin Panel</h3>
        <div className="admin-quick-stats">
          <span className="quick-stat">
            <strong>{voterCount}</strong> Voters
          </span>
          <span className={`quick-stat status ${election?.isActive ? 'active' : 'inactive'}`}>
            {election?.isActive ? '● Active' : '○ Paused'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeSection === 'voters' ? 'active' : ''}`}
          onClick={() => setActiveSection('voters')}
        >
          👥 Voters
        </button>
        <button 
          className={`admin-tab ${activeSection === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveSection('candidates')}
        >
          🎯 Candidates
        </button>
        <button 
          className={`admin-tab ${activeSection === 'merkle' ? 'active' : ''}`}
          onClick={() => setActiveSection('merkle')}
        >
          🌳 Merkle Tree
        </button>
        <button 
          className={`admin-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          ⚡ Status
        </button>
      </div>

      <div className="admin-content">
        {activeSection === 'voters' && (
          <div className="admin-section-content">
            <h4>Register Voter</h4>
            <p className="section-desc">Paste the voter's commitment to allow them to vote.</p>
            <form onSubmit={handleRegisterCommitment}>
              <input
                type="text"
                placeholder="Voter commitment (0x...)"
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !commitment.trim()}
              >
                {loading ? 'Registering...' : 'Register Voter'}
              </button>
            </form>
            {merkleInfo && !merkleInfo.isSynced && (
              <div className="warning-message" style={{ marginTop: '1rem' }}>
                ⚠️ Merkle root out of sync. Will auto-update on next registration.
              </div>
            )}
          </div>
        )}

        {activeSection === 'candidates' && (
          <div className="admin-section-content">
            <h4>Add Candidate</h4>
            <p className="section-desc">Add parties/candidates before election starts.</p>
            <form onSubmit={handleAddCandidate}>
              <input
                type="text"
                placeholder="Candidate / Party name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !candidateName.trim()}
              >
                {loading ? 'Adding...' : 'Add Candidate'}
              </button>
            </form>

            {/* Existing Candidates List */}
            {candidates && candidates.length > 0 && (
              <div className="candidates-list-admin" style={{ marginTop: '1.5rem' }}>
                <h4>Existing Candidates ({candidates.length})</h4>
                {!canModifyCandidates && (
                  <p className="warning-text" style={{ fontSize: '0.8rem', color: 'var(--warning-color)', marginBottom: '0.5rem' }}>
                    ⚠️ Cannot edit/delete during active voting. Pause election first.
                  </p>
                )}
                <div className="candidate-items">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="candidate-item-admin">
                      {editingCandidate === candidate.id ? (
                        <div className="candidate-edit-row">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={loading}
                            style={{ flex: 1, marginBottom: 0 }}
                          />
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleSaveEdit(candidate.id)}
                            disabled={loading || !editName.trim()}
                          >
                            ✓
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="candidate-display-row">
                          <span className="candidate-id-badge">#{candidate.id}</span>
                          <span className="candidate-name-text">{candidate.name}</span>
                          <span className="candidate-votes-badge">{candidate.voteCount} votes</span>
                          {canModifyCandidates && (
                            <div className="candidate-actions">
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEditCandidate(candidate)}
                                disabled={loading}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                                disabled={loading}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'merkle' && (
          <div className="admin-section-content">
            <h4>🌳 Merkle Tree Integrity</h4>
            <p className="section-desc">
              The Merkle root is a cryptographic hash of all voter commitments. 
              It ensures the voter list cannot be tampered with.
            </p>
            
            {merkleInfo && (
              <div className="merkle-info">
                <div className="merkle-stat">
                  <label>On-Chain Root:</label>
                  <code>{formatRoot(merkleInfo.onChainRoot)}</code>
                </div>
                <div className="merkle-stat">
                  <label>Computed Root:</label>
                  <code>{formatRoot(merkleInfo.localRoot)}</code>
                </div>
                <div className="merkle-stat">
                  <label>Voters in Tree:</label>
                  <span>{merkleInfo.leafCount}</span>
                </div>
                <div className="merkle-stat">
                  <label>Tree Depth:</label>
                  <span>{merkleInfo.depth}</span>
                </div>
                <div className="merkle-stat">
                  <label>Status:</label>
                  <span className={merkleInfo.isSynced ? 'synced' : 'not-synced'}>
                    {merkleInfo.isSynced ? '✓ Synced' : '⚠ Out of Sync'}
                  </span>
                </div>
              </div>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={handleUpdateMerkleRoot}
              disabled={loading || (merkleInfo && merkleInfo.isSynced)}
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Updating...' : 'Update Merkle Root'}
            </button>
            
            <div className="info-box" style={{ marginTop: '1rem' }}>
              <strong>Why Merkle Tree?</strong>
              <ul>
                <li>Verifies voter list integrity</li>
                <li>Detects tampering - any change alters the root</li>
                <li>Enables membership proofs without revealing identity</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="admin-section-content">
            <h4>Election Status</h4>
            <p className="section-desc">
              {election?.isActive 
                ? 'Election is active. Voters can cast their votes.' 
                : 'Election is paused. Voting is disabled.'}
            </p>
            <button 
              className={`btn ${election?.isActive ? 'btn-danger' : 'btn-success'}`}
              onClick={handleToggleElection}
              disabled={loading}
              style={{ marginBottom: '1.5rem' }}
            >
              {election?.isActive ? 'Pause Election' : 'Activate Election'}
            </button>

            <h4>Election Time Window</h4>
            <p className="section-desc">Set when voting starts and ends. Can only change before votes are cast.</p>
            <form onSubmit={handleUpdateElectionTime}>
              <div className="time-row">
                <label>Start:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="time-row">
                <label>End:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !startDate || !startTime || !endDate || !endTime}
              >
                {loading ? 'Updating...' : 'Update Time'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
