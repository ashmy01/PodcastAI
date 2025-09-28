// Database initialization script for AI-powered podcast advertising system

import dbConnect from '../lib/db';
import { Campaign } from '../lib/models/Campaign';
import { Podcast } from '../lib/models/Podcast';

async function initializeDatabase() {
  console.log('🚀 Initializing database with sample data...');
  
  try {
    await dbConnect();
    console.log('✅ Connected to database');

    // Create sample campaigns
    const sampleCampaigns = [
      {
        brandId: '0x1234567890123456789012345678901234567890',
        brandName: 'TechFlow Solutions',
        productName: 'AI Code Assistant Pro',
        description: 'Revolutionary AI-powered coding assistant that helps developers write better code faster.',
        category: 'Technology',
        targetAudience: ['Developers', 'Software Engineers', 'Tech Enthusiasts'],
        requirements: [
          'Mention product benefits in natural conversation',
          'Include discount code PODCAST20',
          'Discuss AI coding assistance'
        ],
        budget: 5000,
        currency: 'USDC',
        payoutPerView: 0.01,
        duration: 30,
        status: 'active',
        aiMatchingEnabled: true,
        contentGenerationRules: [
          { type: 'tone', value: 'conversational', required: true },
          { type: 'mention_frequency', value: 2, required: true }
        ],
        verificationCriteria: {
          minQualityScore: 0.7,
          requiredElements: ['product mention', 'discount code'],
          complianceChecks: ['appropriate content', 'proper disclosure'],
          naturalness: 0.6
        },
        qualityThreshold: 0.7
      },
      {
        brandId: '0x2345678901234567890123456789012345678901',
        brandName: 'EcoLife Products',
        productName: 'Sustainable Water Bottle',
        description: 'Eco-friendly water bottle made from recycled materials, perfect for environmentally conscious consumers.',
        category: 'Lifestyle',
        targetAudience: ['Environmentalists', 'Health Enthusiasts', 'Outdoor Enthusiasts'],
        requirements: [
          'Highlight environmental benefits',
          'Mention sustainability features',
          'Include promo code ECO15'
        ],
        budget: 2500,
        currency: 'USDC',
        payoutPerView: 0.008,
        duration: 21,
        status: 'active',
        aiMatchingEnabled: true,
        contentGenerationRules: [
          { type: 'tone', value: 'friendly', required: true },
          { type: 'placement', value: 'natural', required: false }
        ],
        verificationCriteria: {
          minQualityScore: 0.6,
          requiredElements: ['environmental benefits', 'promo code'],
          complianceChecks: ['truthful claims', 'appropriate content'],
          naturalness: 0.7
        },
        qualityThreshold: 0.6
      }
    ];

    // Insert sample campaigns
    for (const campaignData of sampleCampaigns) {
      const existingCampaign = await Campaign.findOne({ 
        brandName: campaignData.brandName,
        productName: campaignData.productName 
      });
      
      if (!existingCampaign) {
        const campaign = new Campaign(campaignData);
        await campaign.save();
        console.log(`✅ Created sample campaign: ${campaignData.productName}`);
      } else {
        console.log(`⏭️  Campaign already exists: ${campaignData.productName}`);
      }
    }

    // Create sample podcasts
    const samplePodcasts = [
      {
        title: 'Tech Talk Daily',
        description: 'Daily discussions about the latest in technology, software development, and AI innovations.',
        concept: 'Technology news and insights for developers',
        tone: 'Professional and conversational',
        frequency: 'Daily',
        length: '30 minutes',
        characters: [
          {
            name: 'Alex',
            personality: 'Tech-savvy host who loves exploring new technologies',
            voice: 'Puck',
            gender: 'neutral'
          },
          {
            name: 'Sam',
            personality: 'Practical developer focused on real-world applications',
            voice: 'Kore',
            gender: 'female'
          }
        ],
        topics: ['Technology', 'Software Development', 'AI', 'Programming'],
        owner: '0x3456789012345678901234567890123456789012',
        monetizationEnabled: true,
        aiContentEnabled: true,
        qualityScore: 0.8,
        contentThemes: ['Technology', 'Software Development', 'AI'],
        averageEngagement: 0.7,
        totalViews: 5000,
        totalEarnings: 250,
        adPreferences: {
          allowedCategories: ['Technology', 'Software', 'Education'],
          blockedBrands: [],
          maxAdsPerEpisode: 2,
          preferredAdPlacement: ['mid-roll'],
          minimumPayoutRate: 0.005
        },
        audienceProfile: {
          demographics: {
            ageRange: '25-45',
            interests: ['Technology', 'Programming', 'AI'],
            location: ['US', 'Europe', 'Asia']
          },
          engagement: {
            averageListenTime: 1800,
            completionRate: 0.75,
            interactionRate: 0.4
          }
        }
      },
      {
        title: 'Green Living Podcast',
        description: 'Exploring sustainable living, eco-friendly products, and environmental consciousness.',
        concept: 'Sustainable lifestyle and environmental awareness',
        tone: 'Friendly and inspiring',
        frequency: 'Weekly',
        length: '45 minutes',
        characters: [
          {
            name: 'Maya',
            personality: 'Environmental advocate passionate about sustainability',
            voice: 'Zephyr',
            gender: 'female'
          },
          {
            name: 'Jordan',
            personality: 'Practical environmentalist with focus on actionable tips',
            voice: 'Enceladus',
            gender: 'male'
          }
        ],
        topics: ['Environment', 'Sustainability', 'Lifestyle', 'Health'],
        owner: '0x4567890123456789012345678901234567890123',
        monetizationEnabled: true,
        aiContentEnabled: true,
        qualityScore: 0.75,
        contentThemes: ['Environment', 'Sustainability', 'Green Living'],
        averageEngagement: 0.65,
        totalViews: 3200,
        totalEarnings: 180,
        adPreferences: {
          allowedCategories: ['Lifestyle', 'Health', 'Environment'],
          blockedBrands: [],
          maxAdsPerEpisode: 1,
          preferredAdPlacement: ['natural'],
          minimumPayoutRate: 0.007
        },
        audienceProfile: {
          demographics: {
            ageRange: '30-55',
            interests: ['Environment', 'Health', 'Sustainability'],
            location: ['US', 'Canada', 'Europe']
          },
          engagement: {
            averageListenTime: 2400,
            completionRate: 0.68,
            interactionRate: 0.35
          }
        }
      }
    ];

    // Insert sample podcasts
    for (const podcastData of samplePodcasts) {
      const existingPodcast = await Podcast.findOne({ 
        title: podcastData.title,
        owner: podcastData.owner 
      });
      
      if (!existingPodcast) {
        const podcast = new Podcast(podcastData);
        await podcast.save();
        console.log(`✅ Created sample podcast: ${podcastData.title}`);
      } else {
        console.log(`⏭️  Podcast already exists: ${podcastData.title}`);
      }
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('Sample data created:');
    console.log('- 2 sample campaigns (TechFlow Solutions, EcoLife Products)');
    console.log('- 2 sample podcasts (Tech Talk Daily, Green Living Podcast)');
    console.log('');
    console.log('You can now:');
    console.log('1. Generate episodes with AI ad integration');
    console.log('2. Test the matching algorithm');
    console.log('3. Verify ad placements');
    console.log('4. Process payouts');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeDatabase };