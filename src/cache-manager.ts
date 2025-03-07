interface CacheOptions {
  namespace?: string;
  ttl?: number;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  namespace: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, Map<string, CacheItem<unknown>>>;
  private cleanupInterval: NodeJS.Timeout;
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutos
  private readonly DEFAULT_NAMESPACE = 'default';
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    this.initializeNamespace(this.DEFAULT_NAMESPACE);
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private initializeNamespace(namespace: string): void {
    if (!this.cache.has(namespace)) {
      this.cache.set(namespace, new Map());
    }
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const namespace = options.namespace || this.DEFAULT_NAMESPACE;
    this.initializeNamespace(namespace);

    const namespaceCache = this.cache.get(namespace);
    if (namespaceCache) {
      namespaceCache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: options.ttl || this.DEFAULT_TTL,
        namespace
      });
    }
  }

  get<T>(key: string, namespace = this.DEFAULT_NAMESPACE): T | undefined {
    const namespaceCache = this.cache.get(namespace);
    if (!namespaceCache) return undefined;

    const item = namespaceCache.get(key) as CacheItem<T>;
    if (!item) return undefined;

    if (this.isExpired(item)) {
      namespaceCache.delete(key);
      return undefined;
    }

    return item.value;
  }

  private isExpired(item: CacheItem<unknown>): boolean {
    return Date.now() > item.timestamp + item.ttl;
  }

  private cleanup(): void {
    for (const [namespace, namespaceCache] of this.cache.entries()) {
      for (const [key, item] of namespaceCache.entries()) {
        if (this.isExpired(item)) {
          namespaceCache.delete(key);
        }
      }

      // Remove namespace vazio
      if (namespaceCache.size === 0) {
        this.cache.delete(namespace);
      }
    }
  }

  getStats(): {
    totalItems: number;
    namespaces: Record<string, number>;
  } {
    const stats = {
      totalItems: 0,
      namespaces: {} as Record<string, number>
    };

    for (const [namespace, namespaceCache] of this.cache.entries()) {
      const itemCount = namespaceCache.size;
      stats.totalItems += itemCount;
      stats.namespaces[namespace] = itemCount;
    }

    return stats;
  }

  clearNamespace(namespace: string): void {
    this.cache.delete(namespace);
  }

  clear(): void {
    this.cache.clear();
    this.initializeNamespace(this.DEFAULT_NAMESPACE);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Exportar instância padrão
export default CacheManager.getInstance();