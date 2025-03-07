import type { CompletionResult } from './types.js';

export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface RequestOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface ApiClient {
  complete(prompt: string, options?: RequestOptions): Promise<CompletionResult>;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  timeout: 30000
};

export function getConfig(): ApiConfig {
  // Carregar configuração de variável de ambiente ou arquivo de configuração
  return {
    ...DEFAULT_CONFIG,
    apiKey: process.env.OPENAI_API_KEY
  };
}

export function createClient(config: ApiConfig): ApiClient {
  if (!config.apiKey) {
    throw new Error('API key is required');
  }

  return {
    async complete(prompt: string, options: RequestOptions = {}) {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.7,
          top_p: options.topP ?? 1.0,
          max_tokens: options.maxTokens,
          frequency_penalty: options.frequencyPenalty ?? 0,
          presence_penalty: options.presencePenalty ?? 0,
          stop: options.stopSequences
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || '',
        model: config.model || 'unknown',
        provider: 'openai'
      };
    }
  };
}