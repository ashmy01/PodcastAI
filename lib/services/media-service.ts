import path from 'path';

// Server-side only imports - wrapped in dynamic imports to prevent client-side bundling
let fs: typeof import('fs/promises') | null = null;
let fsSync: typeof import('fs') | null = null;

// Initialize server-side modules only when running on server
const initServerModules = async () => {
  if (typeof window === 'undefined' && !fs) {
    fs = await import('fs/promises');
    fsSync = await import('fs');
  }
};

export interface AssetMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  dimensions?: { width: number; height: number };
}

export interface MediaAsset {
  id: string;
  type: 'podcast-artwork' | 'brand-logo' | 'episode-audio' | 'user-avatar';
  url: string;
  fallbackUrl?: string;
  metadata: AssetMetadata;
  uploadedAt: Date;
}

export class MediaService {
  private readonly uploadDir = typeof window === 'undefined' ? path.join(process.cwd(), 'public', 'uploads') : '';
  private readonly baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  constructor() {
    // Only initialize on server side
    if (typeof window === 'undefined') {
      this.ensureUploadDir();
    }
  }

  private async ensureUploadDir(): Promise<void> {
    await initServerModules();

    if (!fs || !fsSync) {
      console.warn('MediaService: File system modules not available (client-side)');
      return;
    }

    if (!fsSync.existsSync(this.uploadDir)) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['podcasts', 'brands', 'episodes', 'avatars'];
    for (const subdir of subdirs) {
      const dirPath = path.join(this.uploadDir, subdir);
      if (!fsSync.existsSync(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }

  async uploadPodcastArtwork(file: File, podcastId: string): Promise<string> {
    try {
      await initServerModules();

      if (!fs) {
        console.warn('MediaService: File system not available, using fallback avatar');
        return this.generatePodcastAvatar({ id: podcastId, title: 'Podcast' });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${podcastId}-${Date.now()}.${this.getFileExtension(file.name)}`;
      const filepath = path.join(this.uploadDir, 'podcasts', filename);

      await fs.writeFile(filepath, buffer);

      return `${this.baseUrl}/uploads/podcasts/${filename}`;
    } catch (error) {
      console.error('Error uploading podcast artwork:', error);
      return this.generatePodcastAvatar({ id: podcastId, title: 'Podcast' });
    }
  }

  generatePodcastAvatar(podcastData: { id: string; title: string; tone?: string }): string {
    // Generate avatar based on podcast characteristics
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    // Use podcast ID to generate consistent avatar
    const colorIndex = this.hashString(podcastData.id) % colors.length;

    // For now, return a placeholder service URL (in production, use actual avatar generation)
    const seed = encodeURIComponent(podcastData.id);
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=${colors[colorIndex].slice(1)}`;
  }

  async getAudioUrl(episodeId: string): Promise<string> {
    try {
      await initServerModules();

      if (!fsSync) {
        return '/demo-audio.mp3';
      }

      // Check if audio file exists in storage
      const audioPath = path.join(this.uploadDir, 'episodes', `${episodeId}.mp3`);

      if (fsSync.existsSync(audioPath)) {
        return `${this.baseUrl}/uploads/episodes/${episodeId}.mp3`;
      }
    } catch (error) {
      console.error('Error checking audio file:', error);
    }

    // Return placeholder audio for now (in production, trigger audio generation)
    return '/demo-audio.mp3';
  }

  async getBrandLogo(brandId: string, brandName?: string): Promise<string> {
    try {
      await initServerModules();

      if (fsSync) {
        // Check if brand logo exists
        const logoExtensions = ['png', 'jpg', 'jpeg', 'svg'];

        for (const ext of logoExtensions) {
          const logoPath = path.join(this.uploadDir, 'brands', `${brandId}.${ext}`);
          if (fsSync.existsSync(logoPath)) {
            return `${this.baseUrl}/uploads/brands/${brandId}.${ext}`;
          }
        }
      }
    } catch (error) {
      console.error('Error checking brand logo:', error);
    }

    // Generate brand logo based on name
    return this.generateBrandLogo(brandName || brandId);
  }

  generateBrandLogo(brandName: string): string {
    // Generate logo based on brand name characteristics
    const logoMap: { [key: string]: string } = {
      'tech': '💻',
      'ai': '🤖',
      'eco': '🌱',
      'green': '🌿',
      'health': '💊',
      'medical': '⚕️',
      'finance': '💰',
      'bank': '🏦',
      'education': '📚',
      'learn': '🎓',
      'food': '🍕',
      'restaurant': '🍽️',
      'travel': '✈️',
      'hotel': '🏨',
      'fashion': '👗',
      'clothing': '👕',
      'music': '🎵',
      'audio': '🎧',
      'video': '📹',
      'photo': '📸',
      'game': '🎮',
      'sport': '⚽',
      'car': '🚗',
      'home': '🏠',
      'tool': '🔧',
      'security': '🔒'
    };

    const lowerName = brandName.toLowerCase();
    for (const [key, emoji] of Object.entries(logoMap)) {
      if (lowerName.includes(key)) {
        return emoji;
      }
    }

    // Fallback to first letter avatar
    const firstLetter = brandName.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const colorIndex = this.hashString(brandName) % colors.length;

    return `https://ui-avatars.com/api/?name=${firstLetter}&background=${colors[colorIndex].slice(1)}&color=fff&size=128`;
  }

  async uploadBrandLogo(file: File, brandId: string): Promise<string> {
    try {
      await initServerModules();

      if (!fs) {
        console.warn('MediaService: File system not available, using fallback logo');
        return this.generateBrandLogo(brandId);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${brandId}.${this.getFileExtension(file.name)}`;
      const filepath = path.join(this.uploadDir, 'brands', filename);

      await fs.writeFile(filepath, buffer);

      return `${this.baseUrl}/uploads/brands/${filename}`;
    } catch (error) {
      console.error('Error uploading brand logo:', error);
      return this.generateBrandLogo(brandId);
    }
  }

  async generateUserAvatar(walletAddress: string): Promise<string> {
    // Generate consistent avatar for user
    const seed = encodeURIComponent(walletAddress);
    const style = 'identicon'; // or 'robohash', 'avataaars', etc.

    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  }

  async storeEpisodeAudio(episodeId: string, audioBuffer: Buffer): Promise<string> {
    try {
      await initServerModules();

      if (!fs) {
        console.warn('MediaService: File system not available, using demo audio');
        return '/demo-audio.mp3';
      }

      const filename = `${episodeId}.mp3`;
      const filepath = path.join(this.uploadDir, 'episodes', filename);

      await fs.writeFile(filepath, audioBuffer);

      return `${this.baseUrl}/uploads/episodes/${filename}`;
    } catch (error) {
      console.error('Error storing episode audio:', error);
      return '/demo-audio.mp3';
    }
  }

  async getAssetMetadata(assetId: string): Promise<AssetMetadata | null> {
    // In a real implementation, this would query a database
    // For now, return mock metadata
    return {
      originalName: `${assetId}.png`,
      size: 1024 * 1024, // 1MB
      mimeType: 'image/png',
      uploadedBy: 'system',
      uploadedAt: new Date(),
      dimensions: { width: 512, height: 512 }
    };
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'png';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Utility methods for different asset types
  getPodcastArtworkUrl(podcastId: string): string {
    return `${this.baseUrl}/uploads/podcasts/${podcastId}.png`;
  }

  getBrandLogoUrl(brandId: string): string {
    return `${this.baseUrl}/uploads/brands/${brandId}.png`;
  }

  getEpisodeAudioUrl(episodeId: string): string {
    return `${this.baseUrl}/uploads/episodes/${episodeId}.mp3`;
  }

  getUserAvatarUrl(walletAddress: string): string {
    return `${this.baseUrl}/uploads/avatars/${walletAddress}.png`;
  }

  // Validation methods
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  isValidAudioFile(file: File): boolean {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }
}