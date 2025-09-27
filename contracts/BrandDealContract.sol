// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BrandDealContract
 * @dev Smart contract for managing brand partnership deals with escrow functionality
 */
contract BrandDealContract is ReentrancyGuard, Ownable {
    
    struct BrandDeal {
        address brand;
        address podcaster;
        uint256 totalBudget;
        uint256 releasedAmount;
        address paymentToken; // Address(0) for ETH, token address for ERC20
        uint256 duration; // Duration in seconds
        uint256 createdAt;
        uint256 completedAt;
        bool isActive;
        bool escrowEnabled;
        bool autoRelease;
        bool contentApprovalRequired;
        bool isExclusive;
        string[] requirements;
        string[] completedRequirements;
        mapping(uint256 => Milestone) milestones;
        uint256 milestoneCount;
    }
    
    struct Milestone {
        string description;
        uint256 amount;
        bool isCompleted;
        bool isApproved;
        uint256 completedAt;
    }
    
    struct Application {
        address podcaster;
        string podcastName;
        string message;
        uint256 appliedAt;
        bool isApproved;
        bool isRejected;
    }
    
    // Events
    event DealCreated(uint256 indexed dealId, address indexed brand, uint256 budget);
    event ApplicationSubmitted(uint256 indexed dealId, address indexed podcaster);
    event ApplicationApproved(uint256 indexed dealId, address indexed podcaster);
    event MilestoneCompleted(uint256 indexed dealId, uint256 milestoneId);
    event FundsReleased(uint256 indexed dealId, address indexed podcaster, uint256 amount);
    event DealCompleted(uint256 indexed dealId);
    event DealCancelled(uint256 indexed dealId);
    
    // State variables
    mapping(uint256 => BrandDeal) public deals;
    mapping(uint256 => Application[]) public dealApplications;
    mapping(uint256 => mapping(address => bool)) public hasApplied;
    mapping(address => uint256[]) public brandDeals;
    mapping(address => uint256[]) public podcasterDeals;
    
    uint256 public dealCounter;
    uint256 public platformFeePercent = 250; // 2.5%
    address public platformFeeRecipient;
    
    constructor(address _platformFeeRecipient) {
        platformFeeRecipient = _platformFeeRecipient;
    }
    
    /**
     * @dev Create a new brand deal
     */
    function createDeal(
        uint256 _budget,
        address _paymentToken,
        uint256 _duration,
        bool _escrowEnabled,
        bool _autoRelease,
        bool _contentApprovalRequired,
        bool _isExclusive,
        string[] memory _requirements
    ) external payable nonReentrant returns (uint256) {
        require(_budget > 0, "Budget must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        uint256 dealId = dealCounter++;
        BrandDeal storage deal = deals[dealId];
        
        deal.brand = msg.sender;
        deal.totalBudget = _budget;
        deal.paymentToken = _paymentToken;
        deal.duration = _duration;
        deal.createdAt = block.timestamp;
        deal.isActive = true;
        deal.escrowEnabled = _escrowEnabled;
        deal.autoRelease = _autoRelease;
        deal.contentApprovalRequired = _contentApprovalRequired;
        deal.isExclusive = _isExclusive;
        deal.requirements = _requirements;
        
        // Handle payment
        if (_paymentToken == address(0)) {
            // ETH payment
            require(msg.value == _budget, "Incorrect ETH amount");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "ETH not accepted for token deals");
            IERC20(_paymentToken).transferFrom(msg.sender, address(this), _budget);
        }
        
        brandDeals[msg.sender].push(dealId);
        
        emit DealCreated(dealId, msg.sender, _budget);
        return dealId;
    }
    
    /**
     * @dev Apply for a brand deal
     */
    function applyForDeal(
        uint256 _dealId,
        string memory _podcastName,
        string memory _message
    ) external {
        require(deals[_dealId].isActive, "Deal is not active");
        require(!hasApplied[_dealId][msg.sender], "Already applied");
        require(deals[_dealId].podcaster == address(0), "Deal already has a podcaster");
        
        Application memory application = Application({
            podcaster: msg.sender,
            podcastName: _podcastName,
            message: _message,
            appliedAt: block.timestamp,
            isApproved: false,
            isRejected: false
        });
        
        dealApplications[_dealId].push(application);
        hasApplied[_dealId][msg.sender] = true;
        
        emit ApplicationSubmitted(_dealId, msg.sender);
    }
    
    /**
     * @dev Approve an application (only brand owner)
     */
    function approveApplication(uint256 _dealId, address _podcaster) external {
        require(deals[_dealId].brand == msg.sender, "Only brand owner can approve");
        require(deals[_dealId].isActive, "Deal is not active");
        require(deals[_dealId].podcaster == address(0), "Deal already has a podcaster");
        
        deals[_dealId].podcaster = _podcaster;
        podcasterDeals[_podcaster].push(_dealId);
        
        // Update application status
        Application[] storage applications = dealApplications[_dealId];
        for (uint i = 0; i < applications.length; i++) {
            if (applications[i].podcaster == _podcaster) {
                applications[i].isApproved = true;
                break;
            }
        }
        
        emit ApplicationApproved(_dealId, _podcaster);
    }
    
    /**
     * @dev Add milestone to a deal (only brand owner)
     */
    function addMilestone(
        uint256 _dealId,
        string memory _description,
        uint256 _amount
    ) external {
        require(deals[_dealId].brand == msg.sender, "Only brand owner can add milestones");
        require(deals[_dealId].isActive, "Deal is not active");
        
        uint256 milestoneId = deals[_dealId].milestoneCount++;
        deals[_dealId].milestones[milestoneId] = Milestone({
            description: _description,
            amount: _amount,
            isCompleted: false,
            isApproved: false,
            completedAt: 0
        });
    }
    
    /**
     * @dev Mark milestone as completed (only podcaster)
     */
    function completeMilestone(uint256 _dealId, uint256 _milestoneId) external {
        require(deals[_dealId].podcaster == msg.sender, "Only assigned podcaster can complete milestones");
        require(deals[_dealId].isActive, "Deal is not active");
        require(!deals[_dealId].milestones[_milestoneId].isCompleted, "Milestone already completed");
        
        deals[_dealId].milestones[_milestoneId].isCompleted = true;
        deals[_dealId].milestones[_milestoneId].completedAt = block.timestamp;
        
        // Auto-release funds if enabled and no approval required
        if (deals[_dealId].autoRelease && !deals[_dealId].contentApprovalRequired) {
            _releaseMilestoneFunds(_dealId, _milestoneId);
        }
        
        emit MilestoneCompleted(_dealId, _milestoneId);
    }
    
    /**
     * @dev Approve milestone completion and release funds (only brand owner)
     */
    function approveMilestone(uint256 _dealId, uint256 _milestoneId) external {
        require(deals[_dealId].brand == msg.sender, "Only brand owner can approve milestones");
        require(deals[_dealId].milestones[_milestoneId].isCompleted, "Milestone not completed");
        require(!deals[_dealId].milestones[_milestoneId].isApproved, "Milestone already approved");
        
        deals[_dealId].milestones[_milestoneId].isApproved = true;
        _releaseMilestoneFunds(_dealId, _milestoneId);
    }
    
    /**
     * @dev Internal function to release milestone funds
     */
    function _releaseMilestoneFunds(uint256 _dealId, uint256 _milestoneId) internal {
        BrandDeal storage deal = deals[_dealId];
        Milestone storage milestone = deal.milestones[_milestoneId];
        
        require(milestone.isCompleted, "Milestone not completed");
        require(milestone.amount > 0, "No funds to release");
        
        uint256 platformFee = (milestone.amount * platformFeePercent) / 10000;
        uint256 podcasterAmount = milestone.amount - platformFee;
        
        deal.releasedAmount += milestone.amount;
        
        // Transfer funds
        if (deal.paymentToken == address(0)) {
            // ETH transfer
            payable(deal.podcaster).transfer(podcasterAmount);
            payable(platformFeeRecipient).transfer(platformFee);
        } else {
            // ERC20 transfer
            IERC20(deal.paymentToken).transfer(deal.podcaster, podcasterAmount);
            IERC20(deal.paymentToken).transfer(platformFeeRecipient, platformFee);
        }
        
        emit FundsReleased(_dealId, deal.podcaster, podcasterAmount);
        
        // Check if deal is completed
        if (deal.releasedAmount >= deal.totalBudget) {
            deal.isActive = false;
            deal.completedAt = block.timestamp;
            emit DealCompleted(_dealId);
        }
    }
    
    /**
     * @dev Cancel deal and refund remaining funds (only brand owner)
     */
    function cancelDeal(uint256 _dealId) external nonReentrant {
        require(deals[_dealId].brand == msg.sender, "Only brand owner can cancel");
        require(deals[_dealId].isActive, "Deal is not active");
        
        BrandDeal storage deal = deals[_dealId];
        uint256 refundAmount = deal.totalBudget - deal.releasedAmount;
        
        deal.isActive = false;
        
        if (refundAmount > 0) {
            if (deal.paymentToken == address(0)) {
                payable(msg.sender).transfer(refundAmount);
            } else {
                IERC20(deal.paymentToken).transfer(msg.sender, refundAmount);
            }
        }
        
        emit DealCancelled(_dealId);
    }
    
    /**
     * @dev Get deal applications
     */
    function getDealApplications(uint256 _dealId) external view returns (Application[] memory) {
        return dealApplications[_dealId];
    }
    
    /**
     * @dev Get brand's deals
     */
    function getBrandDeals(address _brand) external view returns (uint256[] memory) {
        return brandDeals[_brand];
    }
    
    /**
     * @dev Get podcaster's deals
     */
    function getPodcasterDeals(address _podcaster) external view returns (uint256[] memory) {
        return podcasterDeals[_podcaster];
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
    
    /**
     * @dev Update platform fee recipient (only owner)
     */
    function updatePlatformFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient address");
        platformFeeRecipient = _newRecipient;
    }
}