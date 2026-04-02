import React from 'react';

/**
 * Header Component - Navigation and wallet connection
 */
function Header({ isConnected, account, network, onConnect, loading }) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon-wrapper">
            <svg className="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L4 10V18C4 28.5 10.8 38.2 20 40C29.2 38.2 36 28.5 36 18V10L20 2Z" fill="url(#shield-gradient)" />
              <path d="M17 20L19.5 22.5L24 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield-gradient" x1="4" y1="2" x2="36" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#42a5f5"/>
                  <stop offset="1" stopColor="#1976d2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <h1>ZKP eVote</h1>
            <span className="logo-subtitle">Zero-Knowledge Proof Electronic Voting</span>
          </div>
        </div>
        
        <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-info">
              <span className="network-badge">{network?.name}</span>
              <span className="account-address">{formatAddress(account)}</span>
              <span className="status-dot connected" title="Connected"></span>
            </div>
          ) : (
            <button 
              className="btn btn-connect"
              onClick={onConnect}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
