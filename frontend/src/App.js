import React, { useState, useEffect, useCallback } from 'react';
import { web3Service } from './services/Web3Service';
import { identityService } from './services/IdentityService';
import Header from './components/Header';
import ElectionInfo from './components/ElectionInfo';
import IdentityPanel from './components/IdentityPanel';
import VotingPanel from './components/VotingPanel';
import ResultsPanel from './components/ResultsPanel';
import AdminPanel from './components/AdminPanel';
import './styles/App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('vote');

  // Load election data
  const loadElectionData = useCallback(async () => {
    try {
      const [electionDetails, candidateList] = await Promise.all([
        web3Service.getElectionDetails(),
        web3Service.getCandidates()
      ]);
      setElection(electionDetails);
      setCandidates(candidateList);
    } catch (err) {
      console.error('Failed to load election data:', err);
    }
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { account: acc, network: net } = await web3Service.connect();
      setAccount(acc);
      setNetwork(net);
      setIsConnected(true);
      
      const adminStatus = await web3Service.isAdmin();
      setIsAdmin(adminStatus);
      
      await loadElectionData();
      
      // Restore identity if exists
      const restoredIdentity = identityService.restoreIdentity();
      if (restoredIdentity) {
        setIdentity(restoredIdentity);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate new identity with unique ID
  const handleGenerateIdentity = (uniqueId) => {
    try {
      const newIdentity = identityService.generateIdentity(uniqueId);
      setIdentity(newIdentity);
    } catch (err) {
      setError('Failed to generate identity: ' + err.message);
    }
  };

  // Refresh data periodically
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(loadElectionData, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, loadElectionData]);

  return (
    <div className="app">
      <Header 
        isConnected={isConnected}
        account={account}
        network={network}
        onConnect={connectWallet}
        loading={loading}
      />
      
      <main className="main-content">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {!isConnected ? (
          <div className="connect-prompt">
            <h2>Welcome to ZKP Voting System</h2>
            <p>Connect your MetaMask wallet to participate in anonymous voting</p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={connectWallet}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <>
            <ElectionInfo election={election} isAdmin={isAdmin} />
            
            <div className="tab-navigation">
              {(election?.isActive || isAdmin) && (
                <button 
                  className={`tab-btn ${activeTab === 'vote' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vote')}
                >
                  Vote
                </button>
              )}
              {/* Show Results: during election, 7 days after end, or for admin */}
              {(() => {
                const now = Math.floor(Date.now() / 1000);
                const sevenDaysAfterEnd = election?.endTime + (7 * 24 * 60 * 60);
                const canViewResults = election?.isActive || now <= sevenDaysAfterEnd || isAdmin;
                return canViewResults && (
                  <button 
                    className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                  >
                    Results
                  </button>
                );
              })()}
              {isAdmin && (
                <button 
                  className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  Admin
                </button>
              )}
            </div>

            <div className="tab-content">
              {activeTab === 'vote' && (
                election?.isActive || isAdmin ? (
                  <div className="voting-section">
                    <IdentityPanel 
                      identity={identity}
                      onGenerate={handleGenerateIdentity}
                    />
                    <VotingPanel 
                      candidates={candidates}
                      identity={identity}
                      election={election}
                      onVoteSuccess={loadElectionData}
                    />
                  </div>
                ) : (
                  <div className="panel">
                    <p>Voting is not available at this time.</p>
                  </div>
                )
              )}
              
              {activeTab === 'results' && (
                <ResultsPanel 
                  candidates={candidates}
                  election={election}
                />
              )}
              
              {activeTab === 'admin' && isAdmin && (
                <AdminPanel 
                  onUpdate={loadElectionData} 
                  election={election} 
                  candidates={candidates}
                />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>ZKP Blockchain Voting System - MTech Project Demo</p>
      </footer>
    </div>
  );
}

export default App;
