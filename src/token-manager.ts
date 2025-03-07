export interface TokenUsage {
  tokens: number;
  cost: number;
  timestamp: number;
}

export interface ProviderQuota {
  dailyLimit: number;
  monthlyLimit: number;
  costPerToken: number;
}

export interface TokenMetrics {
  dailyUsage: number;
  monthlyUsage: number;
  remainingDaily: number;
  remainingMonthly: number;
  lastRotation: number;
}

export class TokenManager {
  private usage: Record<string, TokenUsage[]> = {};
  private quotas: Record<string, ProviderQuota> = {
    deepseek: {
      dailyLimit: 1000000,
      monthlyLimit: 10000000,
      costPerToken: 0.0015
    },
    openrouter: {
      dailyLimit: 500000,
      monthlyLimit: 5000000,
      costPerToken: 0.0010
    },
    anthropic: {
      dailyLimit: 1000000,
      monthlyLimit: 15000000,
      costPerToken: 0.0030
    },
    google: {
      dailyLimit: 800000,
      monthlyLimit: 8000000,
      costPerToken: 0.0008
    }
  };

  constructor() {
    this.initializeUsage();
    this.startMaintenanceInterval();
  }

  private initializeUsage() {
    for (const provider of Object.keys(this.quotas)) {
      this.usage[provider] = [];
    }
  }

  private startMaintenanceInterval() {
    // Limpar dados antigos a cada hora
    setInterval(() => {
      this.cleanOldData();
    }, 3600000);
  }

  private cleanOldData() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    for (const provider of Object.keys(this.usage)) {
      this.usage[provider] = this.usage[provider].filter(
        usage => usage.timestamp > thirtyDaysAgo
      );
    }
  }

  public recordUsage(provider: string, tokens: number) {
    if (!this.usage[provider]) {
      this.usage[provider] = [];
    }

    const cost = tokens * (this.quotas[provider]?.costPerToken || 0);
    
    this.usage[provider].push({
      tokens,
      cost,
      timestamp: Date.now()
    });
  }

  public getMetrics(provider: string): TokenMetrics {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const providerUsage = this.usage[provider] || [];
    const dailyUsage = providerUsage
      .filter(u => u.timestamp > oneDayAgo)
      .reduce((sum, u) => sum + u.tokens, 0);

    const monthlyUsage = providerUsage
      .filter(u => u.timestamp > thirtyDaysAgo)
      .reduce((sum, u) => sum + u.tokens, 0);

    const quota = this.quotas[provider];
    
    return {
      dailyUsage,
      monthlyUsage,
      remainingDaily: quota ? quota.dailyLimit - dailyUsage : 0,
      remainingMonthly: quota ? quota.monthlyLimit - monthlyUsage : 0,
      lastRotation: Math.max(...providerUsage.map(u => u.timestamp), 0)
    };
  }

  public shouldRotateProvider(provider: string): boolean {
    const metrics = this.getMetrics(provider);
    const quota = this.quotas[provider];

    if (!quota) return true;

    // Rotacionar se atingiu 90% do limite diário ou mensal
    const dailyThreshold = quota.dailyLimit * 0.9;
    const monthlyThreshold = quota.monthlyLimit * 0.9;

    return metrics.dailyUsage >= dailyThreshold || 
           metrics.monthlyUsage >= monthlyThreshold;
  }

  public getOptimalProvider(): string {
    const providers = Object.keys(this.quotas);
    let bestProvider = providers[0];
    let maxRemaining = 0;

    for (const provider of providers) {
      const metrics = this.getMetrics(provider);
      const remainingCapacity = Math.min(
        metrics.remainingDaily,
        metrics.remainingMonthly
      );

      if (remainingCapacity > maxRemaining) {
        maxRemaining = remainingCapacity;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  public async getProviderFallback(currentProvider: string): Promise<string> {
    const providers = Object.keys(this.quotas);
    const currentIndex = providers.indexOf(currentProvider);
    
    // Tenta o próximo provider na lista
    const nextIndex = (currentIndex + 1) % providers.length;
    const nextProvider = providers[nextIndex];

    // Verifica se o próximo provider tem capacidade disponível
    if (!this.shouldRotateProvider(nextProvider)) {
      return nextProvider;
    }

    // Se não, usa o provider com mais capacidade disponível
    return this.getOptimalProvider();
  }

  public getAllMetrics(): Record<string, TokenMetrics> {
    const metrics: Record<string, TokenMetrics> = {};
    
    for (const provider of Object.keys(this.quotas)) {
      metrics[provider] = this.getMetrics(provider);
    }

    return metrics;
  }
}

export const tokenManager = new TokenManager();