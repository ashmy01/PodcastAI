import { NextRequest, NextResponse } from 'next/server';
import { getAutomationJobs } from '@/lib/jobs/ai-automation-jobs';

export async function POST(req: NextRequest, { params }: { params: { type: string } }) {
  try {
    const { type } = params;
    const jobs = getAutomationJobs();

    let result;
    
    switch (type) {
      case 'verification':
        await jobs.processPendingVerifications();
        result = { message: 'Verification job completed' };
        break;
        
      case 'payouts':
        await jobs.processAutomatedPayouts();
        result = { message: 'Payout job completed' };
        break;
        
      case 'analytics':
        await jobs.updateAnalyticsMetrics();
        result = { message: 'Analytics job completed' };
        break;
        
      case 'fraud':
        await jobs.detectAndHandleFraud();
        result = { message: 'Fraud detection job completed' };
        break;
        
      case 'cleanup':
        await jobs.cleanupOldData();
        result = { message: 'Cleanup job completed' };
        break;
        
      case 'all':
        await jobs.runAllJobs();
        result = { message: 'All jobs completed' };
        break;
        
      default:
        return NextResponse.json({ 
          message: 'Invalid job type',
          availableTypes: ['verification', 'payouts', 'analytics', 'fraud', 'cleanup', 'all']
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`Error running ${params.type} job:`, error);
    return NextResponse.json({
      message: `Failed to run ${params.type} job`,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { type: string } }) {
  // Return job status/info
  return NextResponse.json({
    jobType: params.type,
    status: 'available',
    description: getJobDescription(params.type)
  });
}

function getJobDescription(type: string): string {
  switch (type) {
    case 'verification':
      return 'Process pending ad placement verifications using AI';
    case 'payouts':
      return 'Process automated payouts for verified ad placements';
    case 'analytics':
      return 'Update campaign analytics and performance metrics';
    case 'fraud':
      return 'Detect and handle fraudulent view activity';
    case 'cleanup':
      return 'Clean up old data and temporary files';
    case 'all':
      return 'Run all automated jobs';
    default:
      return 'Unknown job type';
  }
}