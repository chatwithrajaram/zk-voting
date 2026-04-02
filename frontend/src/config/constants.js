/**
 * Application configuration constants
 */

// Debug: Log environment variables
console.log('ENV CONTRACT_ADDRESS:', process.env.REACT_APP_CONTRACT_ADDRESS);
console.log('ENV NETWORK_ID:', process.env.REACT_APP_NETWORK_ID);

export const CONFIG = {
  CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  NETWORK_ID: parseInt(process.env.REACT_APP_NETWORK_ID) || 31337,
  NETWORK_NAME: process.env.REACT_APP_NETWORK_NAME || 'localhost',
  RPC_URL: process.env.REACT_APP_RPC_URL || 'http://127.0.0.1:8545'
};

export const NETWORK_CONFIG = {
  11155111: {
    name: 'Sepolia',
    chainId: '0xaa36a7',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorer: 'https://sepolia.etherscan.io'
  },
  31337: {
    name: 'Localhost',
    chainId: '0x7a69',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: ''
  }
};

export const STORAGE_KEYS = {
  IDENTITY: 'zkv_identity',
  COMMITMENT: 'zkv_commitment'
};

export const VOTE_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};
