import React from 'react';

/**
 * ElectionInfo Component - Displays election details and status
 */
function ElectionInfo({ election, isAdmin }) {
  if (!election) {
    return (
      <div className="election-info loading">
        <p>Loading election details...</p>
      </div>
    );
  }

  // Hide inactive elections from non-admin users
  if (!election.isActive && !isAdmin) {
    return (
      <div className="election-info">
        <div className="election-header">
          <h2>No Active Election</h2>
        </div>
        <p className="no-election-message">
          There is no active election at this time. Please check back later.
        </p>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const hasStarted = now >= election.startTime;
  const hasEnded = now > election.endTime;
  
  const getStatus = () => {
    if (!election.isActive) return { text: 'Paused', class: 'paused' };
    if (hasEnded) return { text: 'Ended', class: 'ended' };
    if (hasStarted) return { text: 'Active', class: 'active' };
    return { text: 'Upcoming', class: 'upcoming' };
  };

  const status = getStatus();
  
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeRemaining = () => {
    if (hasEnded) return 'Election has ended';
    if (!hasStarted) {
      const diff = election.startTime - now;
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      return `Starts in ${hours}h ${mins}m`;
    }
    const diff = election.endTime - now;
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="election-info">
      <div className="election-header">
        <h2>{election.name}</h2>
        {/* Only show paused status to admin */}
        {(election.isActive || isAdmin) && (
          <span className={`status-badge ${status.class}`}>{status.text}</span>
        )}
      </div>
      
      <div className="election-stats">
        <div className="stat-item">
          <span className="stat-label">Start Time</span>
          <span className="stat-value">{formatDate(election.startTime)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">End Time</span>
          <span className="stat-value">{formatDate(election.endTime)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Votes</span>
          <span className="stat-value">{election.totalVotes}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Time Status</span>
          <span className="stat-value">{getTimeRemaining()}</span>
        </div>
      </div>
      
      {/* Merkle Root - Shows voter list integrity hash */}
      {election.merkleRoot && election.merkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
        <div className="merkle-root-display">
          <label>🌳 Voter List Integrity (Merkle Root)</label>
          <code>{election.merkleRoot.slice(0, 18)}...{election.merkleRoot.slice(-16)}</code>
        </div>
      )}
    </div>
  );
}

export default ElectionInfo;
