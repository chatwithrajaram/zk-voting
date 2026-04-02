**Project Title:** Privacy-Preserving Decentralized Voting System using Zero-Knowledge Proofs and Blockchain

## 1. Problem Statement

Design and implement a decentralized voting system that:

1. Ensures complete voter anonymity—no one can link a vote to a voter
2. Prevents double voting without compromising anonymity
3. Resists Sybil attacks where one person creates multiple identities
4. Provides transparent, verifiable vote counting
5. Maintains election integrity through immutable blockchain records
6. Offers a user-friendly interface for voters and administrators

---

## 2. Objectives

### Primary Objectives

1. **Implement ZKP-based Anonymous Voting:** Use Semaphore protocol to enable voters to prove eligibility without revealing identity

2. **Develop Smart Contract:** Create Solidity contract for secure vote recording, candidate management, and result tabulation

3. **Build Web Interface:** Develop React-based frontend for voter registration, identity generation, and vote casting

4. **Ensure Double-Vote Prevention:** Implement nullifier-based mechanism to prevent multiple votes from same identity

5. **Achieve Sybil Resistance:** Bind identity generation to unique government ID (Aadhaar) to prevent multiple identity creation

## 3. Technology Stack

### 3.1 Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Blockchain | Ethereum | Decentralized ledger |
| Smart Contract | Solidity 0.8.20 | Vote logic & storage |
| ZKP Protocol | Semaphore | Anonymous identity |
| Frontend | React.js 18 | User interface |
| Web3 Library | ethers.js 6.x | Blockchain interaction |
| Development | Hardhat | Contract development |
| Wallet | MetaMask | Transaction signing |

### 3.2 Detailed Stack

#### Backend (Blockchain)

- **Solidity:** Smart contract programming language
- **Hardhat:** Development environment for compiling, testing, deploying
- **OpenZeppelin:** Security patterns and utilities
- **Ethereum:** Decentralized execution platform

#### Frontend

- **React.js:** Component-based UI framework
- **ethers.js:** Ethereum JavaScript library
- **@semaphore-protocol/identity:** ZKP identity generation
- **CSS3:** Styling and responsive design

#### Development Tools

- **Node.js v18+:** JavaScript runtime
- **npm:** Package management
- **MetaMask:** Browser wallet extension
- **Git:** Version control

## 4. Features

### 4.1 Core Features

| Feature | Description |
|---------|-------------|
| Anonymous Voting | Vote without revealing identity |
| Double-Vote Prevention | Cryptographic nullifier mechanism |
| Sybil Resistance | Aadhaar-based identity binding |
| Merkle Tree Integrity | Voter list tamper detection via Merkle root |
| Transparent Results | Real-time vote counts on blockchain |
| Admin Controls | Manage candidates, voters, election settings |
| Time-Bound Elections | Configurable start and end times |

### 4.2 Admin Features

- Add/manage candidates (before election starts)
- Register voter commitments
- Update Merkle root after voter registration
- Update election name and time window
- Activate/deactivate election
- View registered voter count and Merkle tree status
- Access results anytime

### 4.3 Voter Features

- Generate anonymous identity using Aadhaar
- View election details and candidates
- Cast anonymous vote
- View results (during election + 7 days after)
- Backup/restore identity

### 4.4 Security Features

- Local identity generation (never transmitted)
- Deterministic identity from Aadhaar (Sybil resistance)
- Nullifier-based double-vote prevention
- Merkle tree for voter list integrity verification
- Immutable vote records on blockchain
- Time-restricted voting window
- Admin-controlled election status

## 5. Project Structure

```
zk-voting/
│
├── contracts/                    # Smart Contracts
│   └── ZKVoting.sol             # Main voting contract
│
├── scripts/                      # Deployment Scripts
│   └── deploy.js                # Contract deployment
│
├── frontend/                     # React Application
│   ├── public/
│   │   └── index.html           # HTML template
│   │
│   ├── src/
│   │   ├── components/          # React Components
│   │   │   ├── AdminPanel.js    # Admin controls
│   │   │   ├── ElectionInfo.js  # Election display
│   │   │   ├── Header.js        # Navigation
│   │   │   ├── IdentityPanel.js # Identity management
│   │   │   ├── ResultsPanel.js  # Results display
│   │   │   └── VotingPanel.js   # Voting interface
│   │   │
│   │   ├── services/            # Business Logic
│   │   │   ├── IdentityService.js  # ZKP identity
│   │   │   ├── MerkleTreeService.js # Merkle tree operations
│   │   │   └── Web3Service.js      # Blockchain interaction
│   │   │
│   │   ├── config/              # Configuration
│   │   │   ├── constants.js     # App constants
│   │   │   └── contractABI.js   # Contract interface
│   │   │
│   │   ├── styles/              # Styling
│   │   │   ├── App.css          # Component styles
│   │   │   └── index.css        # Global styles
│   │   │
│   │   ├── App.js               # Main component
│   │   └── index.js             # Entry point
│   │
│   ├── .env.example             # Environment template
│   └── package.json             # Dependencies
│
├── utils/                        # Utilities
│   ├── logger.js                # Logging utility
│   └── zkpHelpers.js            # ZKP helpers
│
├── artifacts/                    # Compiled contracts
├── cache/                        # Build cache
├── logs/                         # Application logs
│
├── .env.example                  # Backend env template
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Backend dependencies
└── PROJECT_REPORT.md            # This document

## 6. Setup Instructions

### 6.1 Prerequisites

- Node.js v18 or higher
- npm (comes with Node.js)
- MetaMask browser extension
- Git (for version control)

### 6.2 Installation Steps

**Step 1: Clone Repository**
```bash
git clone <repository-url>
cd zk-voting
```

**Step 2: Install Backend Dependencies**
```bash
npm install
```

**Step 3: Install Frontend Dependencies**
```bash
cd frontend
npm install
cd ..
```

**Step 4: Configure Environment**
```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
```

**Step 5: Update .env (for local development)**
```
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 6.3 Running Locally

**Terminal 1: Start Local Blockchain**
```bash
npm run node
```
This starts a local Ethereum node with 20 pre-funded test accounts.

**Terminal 2: Deploy Contract**
```bash
npm run deploy:local
```
This deploys the ZKVoting contract and adds sample candidates.

**Terminal 3: Start Frontend**
```bash
cd frontend
npm start
```
Opens the application at http://localhost:3000

### 6.4 MetaMask Configuration

1. **Add Local Network:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Admin Account:**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 test ETH

3. **Import Test Voter Account:**
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
