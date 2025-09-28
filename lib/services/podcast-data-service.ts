import 'server-only';
import { Podcast } from '@/lib/models/Podcast';
import { Episode } from '@/lib/models/Episode';
import { AdPlacement } from '@/lib/models/AdPlacement';
import dbConnect from '@/lib/db';

export interface PodcastFilters {
  category?: string;
  tone?: string;
  frequency?: string;
  topics?: string[];
  monetizationEnabled?: boolean;
  minQualityScore?: number;
  limit?: number;
  offset?: number;
}

export interface PodcastAnalytics {
  totalViews: number;
  totalEarnings: number;
  averageEngagement: number;
  followerCount: number;
  monthlyGrowth: number;
  topEpisodes: EpisodeMetrics[];
  audienceDemographics: Demographics;
  earningsPerView: number;
  episodeCount: number;
}

export interface EpisodeMetrics {
  id: string;
  title: string;
  views: number;
  earnings: number;
  duration: string;
  publishedAt: Date;
}

export interface Demographics {
  ageRange: string;
  interests: string[];
  location: string[];
  genderDistribution: { male: number; female: number; other: number };
}

export interface EngagementMetrics {
  averageListenTime: number;
  completionRate: number;
  interactionRate: number;
  skipRate: number;
}

export class PodcastDataService {
  
  async getPublicPodcasts(filters: PodcastFilters = {}): Promise<any[]> {
    await dbConnect();
    
    try {
      const query: any = {
        // Only show podcasts that have episodes and are ready for public viewing
        $expr: { $gt: [{ $size: "$episodes" }, 0] }
      };

      // Apply filters
      if (filters.category) {
        query.topics = { $in: [filters.category] };
      }
      
      if (filters.tone) {
        query.tone = { $regex: new RegExp(filters.tone, 'i') };
      }
      
      if (filters.frequency) {
        query.frequency = { $regex: new RegExp(filters.frequency, 'i') };
      }
      
      if (filters.topics && filters.topics.length > 0) {
        query.topics = { $in: filters.topics };
      }
      
      if (filters.monetizationEnabled !== undefined) {
        query.monetizationEnabled = filters.monetizationEnabled;
      }
      
      if (filters.minQualityScore) {
        query.qualityScore = { $gte: filters.minQualityScore };
      }

      const podcasts = await Podcast.find(query)
        .populate('episodes')
        .sort({ createdAt: -1, totalViews: -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0)
        .lean();

      // Enhance with calculated metrics
      return podcasts.map(podcast => ({
        ...podcast,
        _id: podcast._id.toString(),
        followerCount: this.calculateFollowerCount(podcast),
        episodeCount: podcast.episodes?.length || 0,
        latestEpisode: podcast.episodes?.[podcast.episodes.length - 1] || null
      }));
      
    } catch (error) {
      console.error('Error fetching public podcasts:', error);
      return [];
    }
  }

  async getPodcastById(id: string): Promise<any | null> {
    await dbConnect();
    
    try {
      const podcast = await Podcast.findById(id)
        .populate('episodes')
        .lean();
        
      if (!podcast) return null;

      // Get analytics
      const analytics = await this.getPodcastAnalytics(id);
      
      return {
        ...podcast,
        _id: podcast._id.toString(),
        analytics,
        followerCount: this.calculateFollowerCount(podcast),
        episodeCount: podcast.episodes?.length || 0
      };
      
    } catch (error) {
      console.error('Error fetching podcast by ID:', error);
      return null;
    }
  }

  async getPodcastEpisodes(podcastId: string): Promise<any[]> {
    await dbConnect();
    
    try {
      const episodes = await Episode.find({ podcast: podcastId })
        .sort({ createdAt: -1 })
        .lean();
        
      return episodes.map(episode => ({
        ...episode,
        _id: episode._id.toString(),
        podcast: episode.podcast.toString()
      }));
      
    } catch (error) {
      console.error('Error fetching podcast episodes:', error);
      return [];
    }
  }

  async getPodcastAnalytics(podcastId: string): Promise<PodcastAnalytics> {
    await dbConnect();
    
    try {
      const podcast = await Podcast.findById(podcastId);
      const episodes = await Episode.find({ podcast: podcastId });
      const adPlacements = await AdPlacement.find({ podcastId });
      
      if (!podcast) {
        throw new Error('Podcast not found');
      }

      const totalViews = episodes.reduce((sum, ep) => sum + (ep.totalViews || 0), 0);
      const totalEarnings = episodes.reduce((sum, ep) => sum + (ep.totalEarnings || 0), 0);
      
      // Calculate top episodes
      const topEpisodes: EpisodeMetrics[] = episodes
        .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
        .slice(0, 5)
        .map(ep => ({
          id: ep._id.toString(),
          title: ep.title,
          views: ep.totalViews || 0,
          earnings: ep.totalEarnings || 0,
          duration: this.calculateDuration(ep.script || ''),
          publishedAt: ep.createdAt
        }));

      // Calculate follower count based on engagement and views
      const followerCount = this.calculateFollowerCount(podcast);
      
      // Calculate monthly growth (simplified)
      const monthlyGrowth = this.calculateMonthlyGrowth(podcast, episodes);

      return {
        totalViews,
        totalEarnings,
        averageEngagement: podcast.averageEngagement || 0.5,
        followerCount,
        monthlyGrowth,
        topEpisodes,
        audienceDemographics: {
          ageRange: podcast.audienceProfile?.demographics?.ageRange || '25-45',
          interests: podcast.audienceProfile?.demographics?.interests || podcast.topics || [],
          location: podcast.audienceProfile?.demographics?.location || ['US', 'Europe'],
          genderDistribution: { male: 45, female: 50, other: 5 }
        },
        earningsPerView: totalViews > 0 ? totalEarnings / totalViews : 0,
        episodeCount: episodes.length
      };
      
    } catch (error) {
      console.error('Error fetching podcast analytics:', error);
      return {
        totalViews: 0,
        totalEarnings: 0,
        averageEngagement: 0,
        followerCount: 0,
        monthlyGrowth: 0,
        topEpisodes: [],
        audienceDemographics: {
          ageRange: '',
          interests: [],
          location: [],
          genderDistribution: { male: 0, female: 0, other: 0 }
        },
        earningsPerView: 0,
        episodeCount: 0
      };
    }
  }

  async updatePodcastEngagement(podcastId: string, metrics: EngagementMetrics): Promise<void> {
    await dbConnect();
    
    try {
      await Podcast.findByIdAndUpdate(podcastId, {
        $set: {
          'audienceProfile.engagement': metrics,
          averageEngagement: metrics.completionRate
        }
      });
    } catch (error) {
      console.error('Error updating podcast engagement:', error);
    }
  }

  private calculateFollowerCount(podcast: any): number {
    // Calculate based on total views, engagement, and quality score
    const baseFollowers = Math.floor((podcast.totalViews || 0) * 0.1);
    const engagementMultiplier = (podcast.averageEngagement || 0.5) * 2;
    const qualityMultiplier = (podcast.qualityScore || 0.5) * 1.5;
    
    return Math.floor(baseFollowers * engagementMultiplier * qualityMultiplier) + 100;
  }

  private calculateMonthlyGrowth(podcast: any, episodes: any[]): number {
    if (episodes.length < 2) return 0;
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const recentEpisodes = episodes.filter(ep => new Date(ep.createdAt) >= lastMonth);
    const olderEpisodes = episodes.filter(ep => new Date(ep.createdAt) < lastMonth);
    
    const recentViews = recentEpisodes.reduce((sum, ep) => sum + (ep.totalViews || 0), 0);
    const olderViews = olderEpisodes.reduce((sum, ep) => sum + (ep.totalViews || 0), 0);
    
    if (olderViews === 0) return recentViews > 0 ? 100 : 0;
    
    return Math.round(((recentViews - olderViews) / olderViews) * 100);
  }

  private calculateDuration(script: string): string {
    // Estimate duration based on script length (average reading speed)
    const wordsPerMinute = 150;
    const wordCount = script.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    const seconds = Math.floor((wordCount % wordsPerMinute) / wordsPerMinute * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}