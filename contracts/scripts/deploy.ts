import { ethers } from "hardhat";

async function main() {
  console.log("Deploying BrandDealContract to Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Set platform fee recipient (you can change this to your desired address)
  const platformFeeRecipient = deployer.address; // Using deployer as fee recipient for now

  // Deploy the contract
  const BrandDealContract = await ethers.getContractFactory("BrandDealContract");
  const brandDealContract = await BrandDealContract.deploy(platformFeeRecipient);

  await brandDealContract.waitForDeployment();

  const contractAddress = await brandDealContract.getAddress();
  console.log("BrandDealContract deployed to:", contractAddress);
  console.log("Platform fee recipient:", platformFeeRecipient);

  // Save deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Network: Sepolia (Chain ID: 11155111)");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("Platform Fee Recipient:", platformFeeRecipient);
  console.log("Transaction Hash:", brandDealContract.deploymentTransaction()?.hash);

  // Verify contract on Etherscan (optional)
  console.log("\nTo verify the contract on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress} ${platformFeeRecipient}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });