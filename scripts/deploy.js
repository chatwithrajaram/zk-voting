const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deployment script for ZKVoting contract
 */
async function main() {
  console.log("🚀 Starting ZKVoting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Election configuration
  const electionName = "MTech Demo Election 2024";
  const startTime = Math.floor(Date.now() / 1000) + 60; // Starts in 1 minute
  const endTime = startTime + (7 * 24 * 60 * 60); // Ends in 7 days

  console.log("📋 Election Configuration:");
  console.log("   Name:", electionName);
  console.log("   Start:", new Date(startTime * 1000).toISOString());
  console.log("   End:", new Date(endTime * 1000).toISOString());
  console.log("");

  // Deploy contract
  console.log("⏳ Deploying ZKVoting contract...");
  const ZKVoting = await hre.ethers.getContractFactory("ZKVoting");
  const zkVoting = await ZKVoting.deploy(electionName, startTime, endTime);
  
  await zkVoting.waitForDeployment();
  const contractAddress = await zkVoting.getAddress();
  
  console.log("✅ ZKVoting deployed to:", contractAddress);
  console.log("");

  // Add sample candidates
  console.log("📝 Adding sample candidates...");
  const candidates = ["Alice Johnson", "Bob Smith", "Charlie Brown"];
  
  for (const candidate of candidates) {
    const tx = await zkVoting.addCandidate(candidate);
    await tx.wait();
    console.log("   ✓ Added:", candidate);
  }
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    electionName: electionName,
    startTime: startTime,
    endTime: endTime,
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📁 Deployment info saved to deployments/" + hre.network.name + ".json");
  console.log("");
  console.log("🎉 Deployment complete!");
  console.log("");
  console.log("📌 Next steps:");
  console.log("   1. Update frontend/.env with REACT_APP_CONTRACT_ADDRESS=" + contractAddress);
  console.log("   2. Run: cd frontend && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
