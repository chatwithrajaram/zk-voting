import React from 'react';

/**
 * ResultsPanel Component - Display voting results
 */
function ResultsPanel({ candidates, election }) {
  const totalVotes = election?.totalVotes || 0;
  
  const getPercentage = (voteCount) => {
    if (totalVotes === 0) return 0;
    return ((voteCount / totalVotes) * 100).toFixed(1);
  };

  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const maxVotes = sortedCandidates[0]?.voteCount || 0;

  return (
    <div className="panel results-panel">
      <h3>📊 Election Results</h3>
      
      <div className="results-summary">
        <div className="summary-stat">
          <span className="stat-number">{totalVotes}</span>
          <span className="stat-label">Total Votes</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">{candidates.length}</span>
          <span className="stat-label">Candidates</span>
        </div>
      </div>

      <div className="results-chart">
        {sortedCandidates.map((candidate, index) => (
          <div key={candidate.id} className="result-bar-container">
            <div className="result-info">
              <span className="result-rank">#{index + 1}</span>
              <span className="result-name">{candidate.name}</span>
              <span className="result-votes">
                {candidate.voteCount} votes ({getPercentage(candidate.voteCount)}%)
              </span>
            </div>
            <div className="result-bar-wrapper">
              <div 
                className={`result-bar ${index === 0 && candidate.voteCount > 0 ? 'leading' : ''}`}
                style={{ 
                  width: `${maxVotes > 0 ? (candidate.voteCount / maxVotes) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {totalVotes === 0 && (
        <div className="no-votes-message">
          No votes have been cast yet.
        </div>
      )}

      <div className="results-footer">
        <p>Results are updated in real-time from the blockchain.</p>
      </div>
    </div>
  );
}

export default ResultsPanel;
