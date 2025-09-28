# AI-Powered Podcast Advertising System

A complete Web3-powered platform that uses AI to automatically match brand campaigns with podcasts, generate natural ad content, verify quality, and process payments through smart contracts.

## 🚀 Features

- **AI-Powered Matching**: Automatically matches brand campaigns with relevant podcasts
- **Natural Ad Generation**: AI creates contextually appropriate ad content that feels organic
- **Quality Verification**: AI verifies ad placement quality and compliance before payouts
- **Smart Contract Integration**: Automated, trustless payments through blockchain
- **Real-time Analytics**: Comprehensive performance tracking and optimization suggestions
- **Fraud Detection**: Multi-layer fraud prevention and view validation
- **Creator Dashboard**: Monetization controls and earnings tracking
- **Brand Dashboard**: Campaign management and performance analytics

## 🏗️ Architecture

```
Frontend (Next.js) → API Routes → AI Agents → Smart Contracts
                                     ↓
                              Database (MongoDB)
```

### Core Components

1. **AI Agents**:
   - Matching Agent: Finds compatible podcast-campaign pairs
   - Content Generation Agent: Creates natural ad content
   - Verification Agent: Validates ad quality and compliance

2. **Smart Contract**: Handles verification calls and automated payouts

3. **Database Models**: Campaigns, Podcasts, Episodes, Ad Placements, Analytics

4. **Background Jobs**: Automated verification, payouts, and analytics processing

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Gemini AI API key
- Web3 wallet and RPC endpoint (optional for full functionality)

### 1. Clone and Install

```bash
git clone <repository-url>
cd podcast-ai
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/podcast-ai

# AI Services (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Web3 Configuration (Optional - demo values work for testing)
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
PRIVATE_KEY=your_private_key_here
RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-key
NEXT_PUBLIC_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-key

# Authentication
JWT_SECRET=your_jwt_secret_here

# Feature Flags
ENABLE_AI_ADS=true
ENABLE_AUTO_VERIFICATION=true
ENABLE_AUTO_PAYOUTS=true
```

### 3. Database Setup

Initialize the database with sample data:

```bash
npx ts-node scripts/init-db.ts
```

This creates:
- 2 sample campaigns (TechFlow Solutions, EcoLife Products)
- 2 sample podcasts (Tech Talk Daily, Green Living Podcast)

### 4. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Test the System

1. **Create a Podcast**: Go to `/podcasts` and create a new podcast
2. **Enable Monetization**: In your podcast settings, enable monetization
3. **Generate Episode**: Generate an episode - AI will automatically find matching campaigns and embed ads
4. **View Results**: Check the episode script for embedded ads and view analytics

## 🧪 Testing AI Features

### Manual Job Triggers

Test individual components:

```bash
# Test AI verification
curl -X POST http://localhost:3000/api/jobs/verification

# Test automated payouts
curl -X POST http://localhost:3000/api/jobs/payouts

# Test analytics updates
curl -X POST http://localhost:3000/api/jobs/analytics

# Run all jobs
curl -X POST http://localhost:3000/api/jobs/all
```

### API Endpoints

Key endpoints for testing:

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/podcasts` - List podcasts
- `POST /api/podcasts/[id]/generate` - Generate episode with AI ads
- `POST /api/ai/verify-ad` - Verify ad placement
- `POST /api/ai/track-view` - Track episode view
- `GET /api/health` - System health check

## 📊 How It Works

### 1. Campaign Creation
Brands create campaigns with targeting criteria, budget, and requirements.

### 2. AI Matching
When generating podcast episodes, the AI matching agent:
- Analyzes campaign requirements and podcast content
- Scores compatibility based on audience, content, and brand fit
- Selects best matches above threshold (0.5)

### 3. Content Generation
The AI content generation agent:
- Creates natural ad scripts that match podcast tone and style
- Embeds ads seamlessly into episode conversations
- Ensures all campaign requirements are met

### 4. Verification
The AI verification agent:
- Analyzes ad placement quality and naturalness
- Checks compliance with advertising standards
- Validates that campaign requirements are fulfilled

### 5. Automated Payouts
Smart contracts handle:
- View tracking and fraud detection
- Automated payments based on verified views
- 95% to creators, 5% platform fee

## 🎯 Business Model

- **For Brands**: Automated, quality-guaranteed ad placement with performance tracking
- **For Creators**: Passive income through natural ad integration without content compromise
- **For Platform**: 5% fee on all transactions with minimal operational overhead

## 🔧 Configuration

### AI Model Settings

Adjust AI behavior in `lib/ai/config.ts`:

```typescript
export const AI_CONFIG = {
  MIN_QUALITY_SCORE: 0.7,        // Minimum quality for verification
  MIN_COMPLIANCE_SCORE: 0.8,     // Minimum compliance score
  MATCHING_THRESHOLD: 0.5,       // Minimum compatibility for matching
  MAX_ADS_PER_EPISODE: 3,        // Maximum ads per episode
}
```

### Smart Contract Settings

Configure contract parameters in `lib/web3/contract-service.ts`:

```typescript
const config = {
  gasLimit: 500000,              // Gas limit for transactions
  gasPrice: '20000000000',       // Gas price in wei
  confirmations: 2,              // Required confirmations
}
```

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Deploy with ecosystem config
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
```

### Using Docker

```bash
# Build image
docker build -t podcast-ai .

# Run container
docker run -p 3000:3000 --env-file .env.local podcast-ai
```

### Health Monitoring

Monitor system health:
- `GET /api/health` - Application health
- PM2 monitoring for process management
- Database connection monitoring
- AI service availability checks

## 🔍 Troubleshooting

### Common Issues

1. **AI Services Not Working**
   - Check `GEMINI_API_KEY` is set correctly
   - Verify API key has sufficient quota
   - Check network connectivity

2. **Database Connection Issues**
   - Verify MongoDB is running
   - Check `MONGODB_URI` format
   - Ensure database permissions

3. **Smart Contract Errors**
   - Verify contract address and network
   - Check private key format
   - Ensure sufficient gas and balance

4. **No Ad Matches Found**
   - Check campaign status is 'active'
   - Verify podcast has monetization enabled
   - Lower matching threshold in config

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
ENABLE_ERROR_TRACKING=true
```

## 📈 Performance Optimization

- **Caching**: Redis caching for AI responses and frequent queries
- **Database**: Proper indexing on search fields
- **AI**: Request batching and response caching
- **Background Jobs**: Async processing for heavy operations

## 🔐 Security

- **Input Validation**: All AI inputs sanitized
- **Rate Limiting**: API endpoint protection
- **Private Key Security**: Environment-based key management
- **Content Safety**: AI-powered content filtering
- **Audit Logging**: Comprehensive operation tracking

## 📚 API Documentation

Detailed API documentation available at `/api/docs` when running in development mode.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs at `logs/production.log`
3. Test individual components using manual job triggers
4. Check system health at `/api/health`

---

**Built with AI, powered by Web3, designed for creators and brands.**