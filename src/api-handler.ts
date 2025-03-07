import type { ApiConfig, ModelConfig, RequestOptions } from './api-config.js';
import { apiManager } from './api-config.js';
import type { CompletionRequest, CompletionResult, SystemMetrics } from './types.js';

export class ApiHandler {
  private metrics: SystemMetrics = {
    latency: 0,
    tokens: 0
  };

  public async handleCompletion(request: CompletionRequest): Promise<CompletionResult> {
    const startTime = Date.now();
    
    try {
      const response = await apiManager.handleRequest(request.prompt, request.options);
      
      this.metrics = {
        latency: Date.now() - startTime,
        tokens: response.data?.usage?.total_tokens || 0,
        provider: response.config.provider
      };

      return {
        text: response.text,
        provider: response.config.provider,
        model: response.config.model,
        metrics: this.metrics
      };
    } catch (error) {
      console.error('Erro no ApiHandler:', error);
      throw error;
    }
  }

  public getMetrics(): SystemMetrics {
    return this.metrics;
  }

  public getCurrentProvider(): string {
    return apiManager.getCurrentConfig().provider;
  }

  public getAvailableModels(): ModelConfig[] {
    return Array.from(Object.values(apiManager.getModelConfig('o3-mini-high') || {}));
  }
}

export const apiHandler = new ApiHandler();