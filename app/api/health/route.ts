import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { validateAIConfig } from '@/lib/ai/config';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const checks: any = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // Database connectivity check
    try {
      await dbConnect();
      checks.checks.database = { status: 'healthy', responseTime: Date.now() - startTime };
    } catch (error) {
      checks.checks.database = { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
      checks.status = 'unhealthy';
    }

    // AI service configuration check
    try {
      validateAIConfig();
      checks.checks.aiConfig = { status: 'healthy' };
    } catch (error) {
      checks.checks.aiConfig = { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'AI config invalid'
      };
      checks.status = 'unhealthy';
    }

    // Environment variables check
    const requiredEnvVars = [
      'MONGODB_URI',
      'GEMINI_API_KEY',
      'CONTRACT_ADDRESS',
      'PRIVATE_KEY',
      'RPC_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length === 0) {
      checks.checks.environment = { status: 'healthy' };
    } else {
      checks.checks.environment = { 
        status: 'unhealthy', 
        error: `Missing environment variables: ${missingEnvVars.join(', ')}`
      };
      checks.status = 'unhealthy';
    }

    // System resources check
    const memoryUsage = process.memoryUsage();
    checks.checks.memory = {
      status: memoryUsage.heapUsed < 1024 * 1024 * 1024 ? 'healthy' : 'warning', // 1GB threshold
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    };

    // Response time check
    const responseTime = Date.now() - startTime;
    checks.responseTime = `${responseTime}ms`;
    checks.checks.responseTime = {
      status: responseTime < 1000 ? 'healthy' : 'warning',
      value: responseTime
    };

    // Overall status
    const hasUnhealthy = Object.values(checks.checks).some((check: any) => check.status === 'unhealthy');
    if (hasUnhealthy) {
      checks.status = 'unhealthy';
    }

    const statusCode = checks.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(checks, { status: statusCode });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 });
  }
}