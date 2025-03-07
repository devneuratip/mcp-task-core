import { apiManager } from './api-config.js';
import type { TaskType, ComplexityLevel, ResponseSize, UrgencyLevel } from './types.js';

interface TaskRequirements {
  complexity: ComplexityLevel;
  type: TaskType;
  expectedResponseSize: ResponseSize;
  urgency: UrgencyLevel;
}

interface ModelScore {
  modelName: string;
  score: number;
  reason: string;
}

export class ModelManager {
  private lastUsedModel: string | null = null;
  private modelUsageCount: Record<string, number> = {};
  private modelSuccessRate: Record<string, { success: number; total: number }> = {};

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    const models = ['o3-mini', 'gemini-2.0-flash-thinking', 'deepseek-r1-distill-llama-70b', 'o3-mini-high'];
    for (const model of models) {
      this.modelUsageCount[model] = 0;
      this.modelSuccessRate[model] = { success: 0, total: 0 };
    }
  }

  private getTaskCategory(taskType: string): string[] {
    // Categoriza o tipo de tarefa com base em palavras-chave
    const taskLower = taskType.toLowerCase();
    const categories: string[] = [];

    if (taskLower.includes('code') || taskLower.includes('programming') || taskLower.includes('development')) {
      categories.push('code');
    }
    if (taskLower.includes('math') || taskLower.includes('calculation') || taskLower.includes('numeric')) {
      categories.push('math');
    }
    if (taskLower.includes('analysis') || taskLower.includes('review') || taskLower.includes('evaluate')) {
      categories.push('analysis');
    }
    if (taskLower.includes('general') || categories.length === 0) {
      categories.push('general');
    }

    return categories;
  }

  public selectBestModel(requirements: TaskRequirements): string {
    const scores: ModelScore[] = [];
    const taskCategories = this.getTaskCategory(requirements.type);

    // Avaliar cada modelo
    for (const model of Object.keys(this.modelUsageCount)) {
      const modelConfig = apiManager.getModelConfig(model);
      if (!modelConfig) continue;

      let score = 0;
      const reasons: string[] = [];

      // Pontuação baseada na complexidade
      if (requirements.complexity === 'high') {
        if (modelConfig.contextWindow > 100000) {
          score += 3;
          reasons.push('Alta capacidade de contexto');
        }
      }

      // Pontuação baseada nas categorias detectadas da tarefa
      for (const category of taskCategories) {
        if (modelConfig.capabilities.includes(category)) {
          score += 2;
          reasons.push(`Especializado em ${category}`);
        }
      }

      // Pontuação baseada no tamanho esperado da resposta
      if (requirements.expectedResponseSize === 'long' && modelConfig.contextWindow > 150000) {
        score += 2;
        reasons.push('Adequado para respostas longas');
      }

      // Pontuação baseada na urgência
      if (requirements.urgency === 'high' && modelConfig.costPer1kTokens < 0.002) {
        score += 2;
        reasons.push('Resposta rápida');
      }

      // Ajuste baseado no histórico de sucesso
      const successRate = this.modelSuccessRate[model];
      if (successRate.total > 0) {
        const rate = successRate.success / successRate.total;
        score += rate * 2;
        reasons.push(`Taxa de sucesso: ${(rate * 100).toFixed(1)}%`);
      }

      // Penalização para evitar uso excessivo do mesmo modelo
      if (this.lastUsedModel === model) {
        score -= 1;
        reasons.push('Penalização por uso recente');
      }

      scores.push({
        modelName: model,
        score,
        reason: reasons.join(', ')
      });
    }

    // Ordenar por pontuação e selecionar o melhor
    scores.sort((a, b) => b.score - a.score);
    const selectedModel = scores[0].modelName;

    // Atualizar métricas
    this.lastUsedModel = selectedModel;
    this.modelUsageCount[selectedModel]++;

    console.log('Task categories detected:', taskCategories);
    console.log('Model selection scores:', scores);
    return selectedModel;
  }

  public recordSuccess(modelName: string, success: boolean) {
    if (this.modelSuccessRate[modelName]) {
      this.modelSuccessRate[modelName].total++;
      if (success) {
        this.modelSuccessRate[modelName].success++;
      }
    }
  }

  public getModelMetrics() {
    const metrics: Record<string, {
      usageCount: number;
      successRate: number;
      capabilities: string[];
    }> = {};

    for (const [model, usage] of Object.entries(this.modelUsageCount)) {
      const successRate = this.modelSuccessRate[model];
      const rate = successRate.total > 0 
        ? (successRate.success / successRate.total) * 100 
        : 0;

      const modelConfig = apiManager.getModelConfig(model);
      metrics[model] = {
        usageCount: usage,
        successRate: Number(rate.toFixed(2)),
        capabilities: modelConfig?.capabilities || []
      };
    }

    return metrics;
  }
}

export const modelManager = new ModelManager();