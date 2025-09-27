// Production configuration for AI-powered podcast advertising system

export const PRODUCTION_CONFIG = {
  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-ai-prod',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }
  },

  // AI Services
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_AI_REQUESTS || '10'),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
    retryAttempts: 3,
    retryDelay: 1000,
    
    models: {
      matching: 'gemini-1.5-flash',
      generation: 'gemini-1.5-flash',
      verification: 'gemini-1.5-flash'
    },

    qualityThresholds: {
      minimum: 0.6,
      good: 0.7,
      excellent: 0.8
    }
  },

  // Web3 Configuration
  web3: {
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
    rpcUrl: process.env.RPC_URL,
    gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),
    gasPrice: process.env.GAS_PRICE || '20000000000',
    
    // Network configuration
    chainId: 137, // Polygon Mainnet
    confirmations: 2,
    timeout: 60000
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com',
    timeout: 30000,
    rateLimiting: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100')
    }
  },

  // Caching
  cache: {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
      maxMemoryPolicy: 'allkeys-lru'
    },
    
    strategies: {
      campaigns: 300, // 5 minutes
      podcasts: 600, // 10 minutes
      analytics: 1800, // 30 minutes
      aiResponses: 3600 // 1 hour
    }
  },

  // Job Processing
  jobs: {
    intervals: {
      verification: 5 * 60 * 1000, // 5 minutes
      payouts: 10 * 60 * 1000, // 10 minutes
      analytics: 60 * 60 * 1000, // 1 hour
      cleanup: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    concurrency: {
      verification: 5,
      payouts: 3,
      analytics: 2
    }
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET,
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com'],
    rateLimiting: true,
    requestSizeLimit: '10mb',
    
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32
    }
  },

  // Monitoring and Logging
  monitoring: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING === 'true',
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/production.log',
      maxFiles: 10,
      maxSize: '10m'
    },
    
    metrics: {
      collectInterval: 60000, // 1 minute
      retentionDays: 30
    }
  },

  // Feature Flags
  features: {
    aiAds: process.env.ENABLE_AI_ADS === 'true',
    autoVerification: process.env.ENABLE_AUTO_VERIFICATION === 'true',
    autoPayouts: process.env.ENABLE_AUTO_PAYOUTS === 'true',
    realTimeAnalytics: true,
    advancedMatching: true
  },

  // File Storage
  storage: {
    audioPath: process.env.AUDIO_STORAGE_PATH || 'public/audio',
    maxFileSize: process.env.MAX_AUDIO_FILE_SIZE || '50MB',
    allowedFormats: ['wav', 'mp3', 'ogg'],
    
    cleanup: {
      tempFiles: 24 * 60 * 60 * 1000, // 24 hours
      oldAudio: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  },

  // Notifications
  notifications: {
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      
      templates: {
        campaignMatch: 'campaign-match',
        payoutProcessed: 'payout-processed',
        verificationComplete: 'verification-complete'
      }
    },
    
    webhooks: {
      secret: process.env.WEBHOOK_SECRET,
      timeout: 10000,
      retryAttempts: 3
    }
  },

  // Performance Optimization
  performance: {
    compression: true,
    minification: true,
    
    database: {
      connectionPooling: true,
      queryOptimization: true,
      indexing: true
    },
    
    caching: {
      staticAssets: '1y',
      apiResponses: '5m',
      userSessions: '24h'
    }
  }
};

// Validation function
export function validateProductionConfig(): boolean {
  const required = [
    'MONGODB_URI',
    'GEMINI_API_KEY',
    'CONTRACT_ADDRESS',
    'PRIVATE_KEY',
    'RPC_URL',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }

  return true;
}

// Initialize production configuration
export function initializeProduction(): void {
  if (!validateProductionConfig()) {
    throw new Error('Invalid production configuration');
  }

  console.log('Production configuration initialized successfully');
  console.log('Features enabled:', {
    aiAds: PRODUCTION_CONFIG.features.aiAds,
    autoVerification: PRODUCTION_CONFIG.features.autoVerification,
    autoPayouts: PRODUCTION_CONFIG.features.autoPayouts
  });
}