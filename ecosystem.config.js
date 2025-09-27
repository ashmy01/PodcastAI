// PM2 ecosystem configuration for AI-Powered Podcast Advertising System

module.exports = {
  apps: [
    {
      name: 'podcast-ai-main',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '1G',
      
      // Monitoring
      monitoring: true,
      
      // Advanced features
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'public/audio'],
      
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    },
    
    // Background job processor
    {
      name: 'podcast-ai-jobs',
      script: './lib/jobs/job-processor.js',
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'development',
        JOB_PROCESSOR: 'true'
      },
      
      env_production: {
        NODE_ENV: 'production',
        JOB_PROCESSOR: 'true'
      },
      
      // Logging
      log_file: './logs/jobs-combined.log',
      out_file: './logs/jobs-out.log',
      error_file: './logs/jobs-error.log',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 5000,
      
      // Cron restart (restart daily to prevent memory leaks)
      cron_restart: '0 2 * * *',
      
      // Memory management
      max_memory_restart: '512M'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/podcast-ai.git',
      path: '/var/www/podcast-ai',
      
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      
      // Environment variables for deployment
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/podcast-ai.git',
      path: '/var/www/podcast-ai-staging',
      
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};