# Makefile for BrandDealContract deployment

.PHONY: help install compile deploy verify clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make compile  - Compile contracts"
	@echo "  make deploy   - Deploy contract to Sepolia"
	@echo "  make verify   - Verify contract on Etherscan (requires CONTRACT_ADDRESS)"
	@echo "  make clean    - Clean build artifacts"

# Install dependencies
install:
	npm install

# Compile contracts
compile:
	npx hardhat compile

# Deploy to Sepolia
deploy:
	@echo "Deploying BrandDealContract to Sepolia..."
	npx hardhat run scripts/deploy.ts --network sepolia

# Verify contract on Etherscan
# Usage: make verify CONTRACT_ADDRESS=0x...
verify:
	@if [ -z "$(CONTRACT_ADDRESS)" ]; then \
		echo "Error: CONTRACT_ADDRESS is required"; \
		echo "Usage: make verify CONTRACT_ADDRESS=0x..."; \
		exit 1; \
	fi
	@echo "Verifying contract at $(CONTRACT_ADDRESS)..."
	npx hardhat verify --network sepolia $(CONTRACT_ADDRESS) $(shell grep PRIVATE_KEY .env | cut -d'=' -f2 | head -c 42)

# Clean build artifacts
clean:
	npx hardhat clean
	rm -rf artifacts cache