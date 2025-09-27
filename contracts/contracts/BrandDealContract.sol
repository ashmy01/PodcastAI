// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract PodcastAIMonetization {
    IERC20 public constant PYUSD =
        IERC20(0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9);

    address public aiValidator;
    address public owner;
    uint256 public platformFee = 500; // 5% in basis points

    struct Campaign {
        address brand;
        uint256 budget;
        uint256 remainingBudget;
        uint256 payoutPerView;
        bool active;
    }

    struct Podcast {
        address creator;
        string podcastId;
        bool verified;
        uint256 monthlyFee;
        bool subscriptionEnabled;
    }

    struct AdPlacement {
        bool verified;
        uint256 totalViews;
        uint256 totalPaidOut;
    }

    struct Subscription {
        uint256 expiresAt;
        bool active;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(string => Podcast) public podcasts;
    mapping(uint256 => mapping(string => AdPlacement)) public adPlacements;
    mapping(address => mapping(string => Subscription)) public subscriptions;

    uint256 public nextCampaignId = 1;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed brand,
        uint256 budget
    );
    event PodcastRegistered(string indexed podcastId, address indexed creator);
    event SubscriptionEnabled(string indexed podcastId, uint256 monthlyFee);
    event AdVerified(uint256 indexed campaignId, string indexed podcastId);
    event ViewPayout(
        uint256 indexed campaignId,
        string indexed podcastId,
        uint256 views,
        uint256 totalPayout
    );
    event SubscriptionPurchased(
        address indexed user,
        string indexed podcastId,
        uint256 expiresAt
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAIValidator() {
        require(msg.sender == aiValidator, "Not AI validator");
        _;
    }

    constructor(address _aiValidator) {
        owner = msg.sender;
        aiValidator = _aiValidator;
    }

    // Brand stakes budget for ad campaign
    function createCampaign(
        uint256 _budget,
        uint256 _payoutPerView
    ) external returns (uint256) {
        require(_budget > 0 && _payoutPerView > 0, "Invalid amounts");

        PYUSD.transferFrom(msg.sender, address(this), _budget);

        campaigns[nextCampaignId] = Campaign({
            brand: msg.sender,
            budget: _budget,
            remainingBudget: _budget,
            payoutPerView: _payoutPerView,
            active: true
        });

        emit CampaignCreated(nextCampaignId, msg.sender, _budget);
        return nextCampaignId++;
    }

    // Creator registers their podcast
    function registerPodcast(string calldata _podcastId) external {
        require(bytes(_podcastId).length > 0, "Invalid podcast ID");
        require(
            podcasts[_podcastId].creator == address(0),
            "Podcast already registered"
        );

        podcasts[_podcastId] = Podcast({
            creator: msg.sender,
            podcastId: _podcastId,
            verified: true,
            monthlyFee: 0,
            subscriptionEnabled: false
        });

        emit PodcastRegistered(_podcastId, msg.sender);
    }

    // Creator enables subscription monetization
    function enableSubscription(
        string calldata _podcastId,
        uint256 _monthlyFee
    ) external {
        Podcast storage podcast = podcasts[_podcastId];
        require(podcast.creator == msg.sender, "Not podcast owner");
        require(_monthlyFee > 0, "Invalid fee");

        podcast.monthlyFee = _monthlyFee;
        podcast.subscriptionEnabled = true;

        emit SubscriptionEnabled(_podcastId, _monthlyFee);
    }

    // User subscribes to a podcast
    function subscribeToPodcast(string calldata _podcastId) external {
        Podcast storage podcast = podcasts[_podcastId];
        require(podcast.subscriptionEnabled, "Subscription not enabled");

        uint256 fee = podcast.monthlyFee;
        uint256 platformFeeAmount = (fee * platformFee) / 10000;
        uint256 creatorAmount = fee - platformFeeAmount;

        PYUSD.transferFrom(msg.sender, podcast.creator, creatorAmount);
        PYUSD.transferFrom(msg.sender, owner, platformFeeAmount);

        uint256 expiresAt = block.timestamp + 30 days;
        subscriptions[msg.sender][_podcastId] = Subscription({
            expiresAt: expiresAt,
            active: true
        });

        emit SubscriptionPurchased(msg.sender, _podcastId, expiresAt);
    }

    // AI validator verifies ad placement (no payout yet)
    function verifyAdPlacement(
        uint256 _campaignId,
        string calldata _podcastId
    ) external onlyAIValidator {
        Campaign storage campaign = campaigns[_campaignId];
        Podcast storage podcast = podcasts[_podcastId];

        require(campaign.active, "Campaign inactive");
        require(podcast.verified, "Podcast not verified");
        require(
            !adPlacements[_campaignId][_podcastId].verified,
            "Already verified"
        );

        adPlacements[_campaignId][_podcastId].verified = true;

        emit AdVerified(_campaignId, _podcastId);
    }

    // Called when users view podcast - pays out for verified ads
    function processViews(
        uint256 _campaignId,
        string calldata _podcastId,
        uint256 _viewCount
    ) external onlyAIValidator {
        Campaign storage campaign = campaigns[_campaignId];
        Podcast storage podcast = podcasts[_podcastId];
        AdPlacement storage placement = adPlacements[_campaignId][_podcastId];

        require(campaign.active, "Campaign inactive");
        require(podcast.verified, "Podcast not verified");
        require(placement.verified, "Ad not verified");
        require(_viewCount > 0, "No views to process");

        uint256 totalPayout = campaign.payoutPerView * _viewCount;
        require(campaign.remainingBudget >= totalPayout, "Insufficient budget");

        uint256 platformFeeAmount = (totalPayout * platformFee) / 10000;
        uint256 creatorPayout = totalPayout - platformFeeAmount;

        // Update tracking
        placement.totalViews += _viewCount;
        placement.totalPaidOut += totalPayout;
        campaign.remainingBudget -= totalPayout;

        if (campaign.remainingBudget < campaign.payoutPerView) {
            campaign.active = false;
        }

        // Transfer payments
        PYUSD.transfer(podcast.creator, creatorPayout);
        PYUSD.transfer(owner, platformFeeAmount);

        emit ViewPayout(_campaignId, _podcastId, _viewCount, totalPayout);
    }

    // Brand can withdraw unused budget
    function withdrawCampaignBudget(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.brand == msg.sender, "Not campaign owner");
        require(campaign.remainingBudget > 0, "No budget to withdraw");

        uint256 amount = campaign.remainingBudget;
        campaign.remainingBudget = 0;
        campaign.active = false;

        PYUSD.transfer(msg.sender, amount);
    }

    // Creator can disable subscription
    function disableSubscription(string calldata _podcastId) external {
        Podcast storage podcast = podcasts[_podcastId];
        require(podcast.creator == msg.sender, "Not podcast owner");

        podcast.subscriptionEnabled = false;
        podcast.monthlyFee = 0;
    }

    // Admin functions
    function setAIValidator(address _newValidator) external onlyOwner {
        aiValidator = _newValidator;
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
    }

    function pauseCampaign(uint256 _campaignId) external onlyOwner {
        campaigns[_campaignId].active = false;
    }

    // View functions
    function getCampaign(
        uint256 _campaignId
    )
        external
        view
        returns (
            address brand,
            uint256 budget,
            uint256 remainingBudget,
            uint256 payoutPerView,
            bool active
        )
    {
        Campaign memory campaign = campaigns[_campaignId];
        return (
            campaign.brand,
            campaign.budget,
            campaign.remainingBudget,
            campaign.payoutPerView,
            campaign.active
        );
    }

    function getPodcast(
        string calldata _podcastId
    )
        external
        view
        returns (
            address creator,
            bool verified,
            uint256 monthlyFee,
            bool subscriptionEnabled
        )
    {
        Podcast memory podcast = podcasts[_podcastId];
        return (
            podcast.creator,
            podcast.verified,
            podcast.monthlyFee,
            podcast.subscriptionEnabled
        );
    }

    function getAdPlacement(
        uint256 _campaignId,
        string calldata _podcastId
    )
        external
        view
        returns (bool verified, uint256 totalViews, uint256 totalPaidOut)
    {
        AdPlacement memory placement = adPlacements[_campaignId][_podcastId];
        return (
            placement.verified,
            placement.totalViews,
            placement.totalPaidOut
        );
    }

    function getSubscription(
        address _user,
        string calldata _podcastId
    ) external view returns (uint256 expiresAt, bool active) {
        Subscription memory sub = subscriptions[_user][_podcastId];
        bool isActive = sub.active && sub.expiresAt > block.timestamp;
        return (sub.expiresAt, isActive);
    }

    function hasActiveSubscription(
        address _user,
        string calldata _podcastId
    ) external view returns (bool) {
        Subscription memory sub = subscriptions[_user][_podcastId];
        return sub.active && sub.expiresAt > block.timestamp;
    }
}
