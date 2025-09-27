import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxRetries: number;
  retryDelay: number;
}

export class AIServiceError extends Error {
  constructor(
    public service: 'matching' | 'generation' | 'verification',
    public code: string,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  baseDelay: number;
}

export abstract class BaseAIService {
  protected genAI: GoogleGenerativeAI;
  protected model: any;
  protected retryConfig: RetryConfig;

  constructor(
    protected config: AIServiceConfig,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
    this.retryConfig = {
      maxRetries: config.maxRetries || 3,
      backoffStrategy: 'exponential',
      baseDelay: config.retryDelay || 1000,
      ...retryConfig
    };
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryConfig.maxRetries) {
          throw new AIServiceError(
            this.getServiceType(),
            'MAX_RETRIES_EXCEEDED',
            `Failed after ${this.retryConfig.maxRetries} retries: ${lastError.message}`,
            false
          );
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`AI service retry ${attempt + 1}/${this.retryConfig.maxRetries} for ${context}:`, error);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    switch (this.retryConfig.backoffStrategy) {
      case 'exponential':
        return this.retryConfig.baseDelay * Math.pow(2, attempt);
      case 'linear':
        return this.retryConfig.baseDelay * (attempt + 1);
      case 'fixed':
      default:
        return this.retryConfig.baseDelay;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected abstract getServiceType(): 'matching' | 'generation' | 'verification';

  protected async generateContent(prompt: string): Promise<string> {
    return this.executeWithRetry(async () => {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    }, 'generateContent');
  }

  protected validateInput(input: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!input[field]) {
        throw new AIServiceError(
          this.getServiceType(),
          'INVALID_INPUT',
          `Missing required field: ${field}`,
          false
        );
      }
    }
  }
}