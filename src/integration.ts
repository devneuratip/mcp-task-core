import type { RequestOptions } from './api-config.js';
import { apiManager } from './api-config.js';
import { modelManager } from './model-manager.js';
import { tokenManager } from './token-manager.js';
import type {
  ResponseSize,
  UrgencyLevel,
  TaskType,
  CompletionRequest,
  CompletionResult,
  SystemMetrics
} from './types.js';

interface RequestResult {
  text: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class IntegrationManager {
  private retryAttempts = 0;
  private readonly maxRetries = 3;

  public async getCompletion(request: CompletionRequest): Promise<CompletionResult> {
    try {
      // 1. Selecionar o melhor modelo baseado nos requisitos
      const taskRequirements = {
        complexity: 'medium' as const,
        type: 'general',
        expectedResponseSize: 'medium' as const,
        urgency: 'medium' as const
      };
      
      const selectedModel = modelManager.selectBestModel(taskRequirements);
      
      // 2. Verificar quota de tokens do provider atual
      const provider = apiManager.getCurrentConfig().provider;
      
      if (tokenManager.shouldRotateProvider(provider)) {
        const newProvider = await tokenManager.getProviderFallback(provider);
        if (newProvider !== provider) {
          apiManager.switchProvider();
        }
      }

      // 3. Fazer a requisição
      const startTime = Date.now();
      const result = await this.makeRequest(request, selectedModel);
      const latency = Date.now() - startTime;

      // 4. Registrar métricas
      this.recordMetrics(selectedModel, result, latency);

      return {
        text: result.text,
        model: selectedModel,
        provider: apiManager.getCurrentConfig().provider,
        metrics: {
          latency,
          tokens: result.tokenUsage.total
        }
      };

    } catch (error) {
      console.error('Erro na requisição:', error);
      
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        console.log(`Tentativa ${this.retryAttempts} de ${this.maxRetries}`);
        return this.getCompletion(request);
      }

      this.retryAttempts = 0;
      throw new Error('Todas as tentativas falharam');
    }
  }

  private async makeRequest(request: CompletionRequest, model: string): Promise<RequestResult> {
    const config = apiManager.getCurrentConfig();
    
    const response = await apiManager.handleRequest(request.prompt, request.options);

    // Simular contagem de tokens
    const tokenCount = {
      prompt: Math.ceil(request.prompt.length / 4),
      completion: Math.ceil(request.prompt.length / 2),
      total: Math.ceil(request.prompt.length * 0.75)
    };

    tokenManager.recordUsage(config.provider, tokenCount.total);

    return {
      text: response.text,
      tokenUsage: tokenCount
    };
  }

  private recordMetrics(model: string, result: RequestResult, latency: number): void {
    const isSuccessful = Boolean(result?.text) && latency < 30000;
    modelManager.recordSuccess(model, isSuccessful);
  }

  public getSystemMetrics(): SystemMetrics {
    const tokenMetrics = tokenManager.getAllMetrics();
    const totalTokens = Object.values(tokenMetrics).reduce((sum, current) => sum + (typeof current === 'number' ? current : 0), 0);
    
    return {
      latency: 0,
      tokens: totalTokens,
      provider: apiManager.getCurrentConfig().provider
    };
  }

  public async forceProviderRotation() {
    const currentProvider = apiManager.getCurrentConfig().provider;
    const nextProvider = await tokenManager.getProviderFallback(currentProvider);
    apiManager.switchProvider();
    return {
      previousProvider: currentProvider,
      newProvider: nextProvider,
      metrics: this.getSystemMetrics()
    };
  }
}

export const integrationManager = new IntegrationManager();
