import React, { useState, useRef } from 'react';
import { identityService } from '../services/IdentityService';

/**
 * IdentityPanel Component - ZKP identity management
 */
function IdentityPanel({ identity, onGenerate }) {
  const [importValue, setImportValue] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [aadhaar1, setAadhaar1] = useState('');
  const [aadhaar2, setAadhaar2] = useState('');
  const [aadhaar3, setAadhaar3] = useState('');
  const [idError, setIdError] = useState('');
  
  const input1Ref = useRef(null);
  const input2Ref = useRef(null);
  const input3Ref = useRef(null);

  const handleAadhaarChange = (value, setter, nextRef) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setter(cleaned);
    if (cleaned.length === 4 && nextRef) {
      nextRef.current.focus();
    }
  };

  const handleKeyDown = (e, prevRef, currentValue) => {
    if (e.key === 'Backspace' && currentValue === '' && prevRef) {
      prevRef.current.focus();
    }
  };

  const handleGenerateWithId = () => {
    setIdError('');
    const fullAadhaar = aadhaar1 + aadhaar2 + aadhaar3;
    
    if (fullAadhaar.length !== 12) {
      setIdError('Please enter all 12 digits of Aadhaar number');
      return;
    }
    if (!/^\d{12}$/.test(fullAadhaar)) {
      setIdError('Aadhaar number must contain only digits');
      return;
    }
    onGenerate(fullAadhaar);
    setAadhaar1('');
    setAadhaar2('');
    setAadhaar3('');
  };

  const handleExport = () => {
    try {
      const backup = identityService.exportIdentity();
      navigator.clipboard.writeText(backup);
      alert('Identity copied to clipboard! Store it safely.');
    } catch (err) {
      alert('Failed to export identity');
    }
  };

  const handleImport = () => {
    try {
      identityService.importIdentity(importValue);
      window.location.reload();
    } catch (err) {
      alert('Invalid identity string');
    }
  };

  return (
    <div className="panel identity-panel">
      <h3>🔐 Your Identity</h3>
      
      {identity ? (
        <div className="identity-info">
          <div className="identity-status">
            <span className="status-icon">✓</span>
            <span>Identity Generated</span>
          </div>
          
          <div className="commitment-display">
            <label>Your Commitment (for Admin):</label>
            <code 
              title="Click to copy"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard.writeText(identity.commitmentHex);
                alert('Commitment copied!');
              }}
            >
              {identity.commitmentHex}
            </code>
          </div>
          
          <p className="identity-note">
            Click the commitment above to copy it. Share this with the admin for registration.
          </p>
          
          <div className="identity-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
            >
              Backup Identity
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => {
                if (window.confirm('This will delete your current identity. Continue?')) {
                  identityService.clearIdentity();
                  window.location.reload();
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="identity-setup">
          <p>Enter your Aadhaar number to generate an anonymous voting identity.</p>
          
          <div className="id-input-section">
            <div className="aadhaar-inputs">
              <input
                ref={input1Ref}
                type="text"
                placeholder="XXXX"
                value={aadhaar1}
                onChange={(e) => handleAadhaarChange(e.target.value, setAadhaar1, input2Ref)}
                maxLength={4}
                className="aadhaar-input"
              />
              <span className="aadhaar-separator">-</span>
              <input
                ref={input2Ref}
                type="text"
                placeholder="XXXX"
                value={aadhaar2}
                onChange={(e) => handleAadhaarChange(e.target.value, setAadhaar2, input3Ref)}
                onKeyDown={(e) => handleKeyDown(e, input1Ref, aadhaar2)}
                maxLength={4}
                className="aadhaar-input"
              />
              <span className="aadhaar-separator">-</span>
              <input
                ref={input3Ref}
                type="text"
                placeholder="XXXX"
                value={aadhaar3}
                onChange={(e) => handleAadhaarChange(e.target.value, setAadhaar3, null)}
                onKeyDown={(e) => handleKeyDown(e, input2Ref, aadhaar3)}
                maxLength={4}
                className="aadhaar-input"
              />
            </div>
            {idError && <span className="error-text">{idError}</span>}
            <p className="help-text">
              Your Aadhaar is hashed locally and never stored or transmitted. 
              Same Aadhaar always generates the same identity, preventing duplicate registrations.
            </p>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleGenerateWithId}
            disabled={aadhaar1.length + aadhaar2.length + aadhaar3.length !== 12}
          >
            Generate Identity
          </button>
          
          <div className="divider">or</div>
          
          {showImport ? (
            <div className="import-section">
              <textarea
                placeholder="Paste your identity backup here..."
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                rows={3}
              />
              <div className="import-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleImport}
                  disabled={!importValue}
                >
                  Import
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowImport(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="btn btn-outline"
              onClick={() => setShowImport(true)}
            >
              Import Existing Identity
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default IdentityPanel;
