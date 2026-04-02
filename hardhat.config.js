require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};


// Gas Reporter - shows gas usage for each function
module.exports.gasReporter = {
  enabled: true,
  currency: 'USD',
  gasPrice: 20
};

// Task to estimate gas for all contract operations
task("gas-estimate", "Estimates gas for all contract operations")
  .setAction(async (_, hre) => {
    const ZKVoting = await hre.ethers.getContractFactory("ZKVoting");
    
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600; // 1 hour from now
    const endTime = now + (7 * 24 * 60 * 60); // 7 days from now
    
    const deployTx = await ZKVoting.getDeployTransaction(
      "Test Election",
      startTime,
      endTime
    );
    
    const gasEstimate = await hre.ethers.provider.estimateGas(deployTx);
    const feeData = await hre.ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║              📊 GAS ESTIMATION REPORT                       ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Gas Price: ${hre.ethers.formatUnits(gasPrice, 'gwei').padEnd(20)} Gwei              ║`);
    console.log("╚════════════════════════════════════════════════════════════╝");
    
    // Deploy contract for testing
    const contract = await ZKVoting.deploy("Test Election", startTime, endTime);
    await contract.waitForDeployment();
    
    // Add a candidate first (needed for vote testing)
    await contract.addCandidate("Test Candidate");
    
    // Register a commitment (needed for vote testing)
    const commitment = "0x" + "a".repeat(64);
    await contract.registerCommitment(commitment);
    
    console.log("\n┌────────────────────────────────────────────────────────────┐");
    console.log("│                    DEPLOYMENT                              │");
    console.log("├──────────────────────────┬─────────────┬───────────────────┤");
    console.log("│ Operation                │ Gas Units   │ Cost (ETH)        │");
    console.log("├──────────────────────────┼─────────────┼───────────────────┤");
    const deployCost = hre.ethers.formatEther(gasEstimate * gasPrice);
    console.log(`│ Deploy Contract          │ ${gasEstimate.toString().padEnd(11)} │ ${deployCost.slice(0,17).padEnd(17)} │`);
    console.log("└──────────────────────────┴─────────────┴───────────────────┘");
    
    console.log("\n┌────────────────────────────────────────────────────────────┐");
    console.log("│                 ADMIN FUNCTIONS (Write)                    │");
    console.log("├──────────────────────────┬─────────────┬───────────────────┤");
    console.log("│ Function                 │ Gas Units   │ Cost (ETH)        │");
    console.log("├──────────────────────────┼─────────────┼───────────────────┤");
    
    // addCandidate
    const addCandidateGas = await contract.addCandidate.estimateGas("New Candidate");
    const addCandidateCost = hre.ethers.formatEther(addCandidateGas * gasPrice);
    console.log(`│ addCandidate()           │ ${addCandidateGas.toString().padEnd(11)} │ ${addCandidateCost.slice(0,17).padEnd(17)} │`);
    
    // registerCommitment
    const newCommitment = "0x" + "b".repeat(64);
    const registerGas = await contract.registerCommitment.estimateGas(newCommitment);
    const registerCost = hre.ethers.formatEther(registerGas * gasPrice);
    console.log(`│ registerCommitment()     │ ${registerGas.toString().padEnd(11)} │ ${registerCost.slice(0,17).padEnd(17)} │`);
    
    // setElectionStatus
    const statusGas = await contract.setElectionStatus.estimateGas(false);
    const statusCost = hre.ethers.formatEther(statusGas * gasPrice);
    console.log(`│ setElectionStatus()      │ ${statusGas.toString().padEnd(11)} │ ${statusCost.slice(0,17).padEnd(17)} │`);
    
    // setElectionTime
    const newStart = now + 7200;
    const newEnd = now + (14 * 24 * 60 * 60);
    const timeGas = await contract.setElectionTime.estimateGas(newStart, newEnd);
    const timeCost = hre.ethers.formatEther(timeGas * gasPrice);
    console.log(`│ setElectionTime()        │ ${timeGas.toString().padEnd(11)} │ ${timeCost.slice(0,17).padEnd(17)} │`);
    
    // setElectionName
    const nameGas = await contract.setElectionName.estimateGas("New Name");
    const nameCost = hre.ethers.formatEther(nameGas * gasPrice);
    console.log(`│ setElectionName()        │ ${nameGas.toString().padEnd(11)} │ ${nameCost.slice(0,17).padEnd(17)} │`);
    
    // updateMerkleRoot
    const merkleRoot = "0x" + "d".repeat(64);
    const merkleGas = await contract.updateMerkleRoot.estimateGas(merkleRoot);
    const merkleCost = hre.ethers.formatEther(merkleGas * gasPrice);
    console.log(`│ updateMerkleRoot()       │ ${merkleGas.toString().padEnd(11)} │ ${merkleCost.slice(0,17).padEnd(17)} │`);
    
    console.log("└──────────────────────────┴─────────────┴───────────────────┘");
    
    console.log("\n┌────────────────────────────────────────────────────────────┐");
    console.log("│                 VOTER FUNCTIONS (Write)                    │");
    console.log("├──────────────────────────┬─────────────┬───────────────────┤");
    console.log("│ Function                 │ Gas Units   │ Cost (ETH)        │");
    console.log("├──────────────────────────┼─────────────┼───────────────────┤");
    
    // vote - need to activate and set proper time first
    await contract.setElectionStatus(true);
    await contract.setElectionTime(now - 60, endTime);
    
    const nullifier = "0x" + "c".repeat(64);
    const voteGas = await contract.vote.estimateGas(nullifier, 1, commitment);
    const voteCost = hre.ethers.formatEther(voteGas * gasPrice);
    console.log(`│ vote()                   │ ${voteGas.toString().padEnd(11)} │ ${voteCost.slice(0,17).padEnd(17)} │`);
    
    // voteWithProof (with empty proof for estimation)
    const nullifier2 = "0x" + "e".repeat(64);
    const commitment2 = "0x" + "b".repeat(64);
    await contract.registerCommitment(commitment2);
    const voteProofGas = await contract.voteWithProof.estimateGas(nullifier2, 1, commitment2, []);
    const voteProofCost = hre.ethers.formatEther(voteProofGas * gasPrice);
    console.log(`│ voteWithProof()          │ ${voteProofGas.toString().padEnd(11)} │ ${voteProofCost.slice(0,17).padEnd(17)} │`);
    
    console.log("└──────────────────────────┴─────────────┴───────────────────┘");
    
    console.log("\n┌────────────────────────────────────────────────────────────┐");
    console.log("│                 VIEW FUNCTIONS (Free)                      │");
    console.log("├──────────────────────────┬─────────────┬───────────────────┤");
    console.log("│ Function                 │ Gas Units   │ Cost (ETH)        │");
    console.log("├──────────────────────────┼─────────────┼───────────────────┤");
    console.log("│ getElectionDetails()     │ 0           │ FREE              │");
    console.log("│ getAllCandidates()       │ 0           │ FREE              │");
    console.log("│ getCandidate()           │ 0           │ FREE              │");
    console.log("│ isCommitmentRegistered() │ 0           │ FREE              │");
    console.log("│ isNullifierUsed()        │ 0           │ FREE              │");
    console.log("│ isVotingOpen()           │ 0           │ FREE              │");
    console.log("│ getRegisteredVoterCount()│ 0           │ FREE              │");
    console.log("│ getMerkleRoot()          │ 0           │ FREE              │");
    console.log("│ getAllCommitments()      │ 0           │ FREE              │");
    console.log("│ verifyMerkleProof()      │ 0           │ FREE              │");
    console.log("└──────────────────────────┴─────────────┴───────────────────┘");
    
    console.log("\n💡 Notes:");
    console.log("   • Gas costs vary based on input data size");
    console.log("   • View functions are FREE (no gas required)");
    console.log("   • Actual costs depend on network gas price");
    console.log("   • Local testnet uses free test ETH\n");
  });
