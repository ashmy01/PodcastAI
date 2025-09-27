import { ethers } from "hardhat";

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.error("Please provide the contract address as an argument");
    console.error("Usage: npx hardhat run scripts/verify.ts --network sepolia <CONTRACT_ADDRESS>");
    process.exit(1);
  }

  console.log("Verifying contract at:", contractAddress);

  // Get the contract instance
  const BrandDealContract = await ethers.getContractFactory("BrandDealContract");
  const contract = BrandDealContract.attach(contractAddress);

  try {
    // Test basic contract functions
    const dealCounter = await contract.dealCounter();
    const platformFeePercent = await contract.platformFeePercent();
    const platformFeeRecipient = await contract.platformFeeRecipient();

    console.log("Contract verification successful!");
    console.log("Deal Counter:", dealCounter.toString());
    console.log("Platform Fee Percent:", platformFeePercent.toString(), "basis points");
    console.log("Platform Fee Recipient:", platformFeeRecipient);
  } catch (error) {
    console.error("Contract verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });