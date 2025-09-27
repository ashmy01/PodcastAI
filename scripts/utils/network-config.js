const networkConfig = {
  31337: {
    name: "hardhat",
    gasPrice: 8000000000, // 8 gwei
    blockConfirmations: 1,
  },
  11155111: {
    name: "sepolia",
    gasPrice: 20000000000, // 20 gwei
    blockConfirmations: 6,
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  1: {
    name: "mainnet",
    gasPrice: 30000000000, // 30 gwei
    blockConfirmations: 6,
    ethUsdPriceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  },
};

const developmentChains = ["hardhat", "localhost"];

function getNetworkConfig(chainId) {
  return networkConfig[chainId];
}

function isDevelopmentChain(network) {
  return developmentChains.includes(network);
}

module.exports = {
  networkConfig,
  developmentChains,
  getNetworkConfig,
  isDevelopmentChain,
};