import { describe, test, expect, beforeEach } from '@jest/globals';
import cacheManager from '../cache-manager.js';

describe('CacheManager', () => {
  beforeEach(() => {
    // Limpar o cache antes de cada teste
    cacheManager.clear();
  });

  test('deve armazenar e recuperar um valor', () => {
    const key = 'testKey';
    const value = { test: 'data' };

    cacheManager.set(key, value);
    const retrieved = cacheManager.get(key);

    expect(retrieved).toEqual(value);
  });

  test('deve respeitar o namespace', () => {
    const key = 'testKey';
    const value1 = { test: 'data1' };
    const value2 = { test: 'data2' };
    const namespace1 = 'ns1';
    const namespace2 = 'ns2';

    cacheManager.set(key, value1, { namespace: namespace1 });
    cacheManager.set(key, value2, { namespace: namespace2 });

    const retrieved1 = cacheManager.get(key, namespace1);
    const retrieved2 = cacheManager.get(key, namespace2);

    expect(retrieved1).toEqual(value1);
    expect(retrieved2).toEqual(value2);
  });

  test('deve retornar undefined para chaves não existentes', () => {
    const key = 'nonexistentKey';
    const retrieved = cacheManager.get(key);

    expect(retrieved).toBeUndefined();
  });

  test('deve limpar o cache corretamente', () => {
    const key = 'testKey';
    const value = { test: 'data' };

    cacheManager.set(key, value);
    cacheManager.clear();

    const retrieved = cacheManager.get(key);
    expect(retrieved).toBeUndefined();
  });

  test('deve retornar estatísticas corretas', () => {
    const key1 = 'key1';
    const key2 = 'key2';
    const namespace = 'test';

    cacheManager.set(key1, 'value1', { namespace });
    cacheManager.set(key2, 'value2', { namespace });

    const stats = cacheManager.getStats();
    expect(stats.totalItems).toBe(2);
    expect(stats.namespaces[namespace]).toBe(2);
  });
});