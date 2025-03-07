import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import { DatabaseService } from '../services/database.js';

const TEST_DIR = join(process.cwd(), 'test-data');
const TEST_BACKUP_DIR = join(process.cwd(), 'test-backup');

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    // Criar diretórios de teste
    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(TEST_BACKUP_DIR, { recursive: true });

    db = new DatabaseService({
      dataDir: TEST_DIR,
      backupDir: TEST_BACKUP_DIR,
      backupInterval: 1000,
      maxBackups: 3
    });
  });

  afterEach(async () => {
    // Limpar diretórios de teste
    await rm(TEST_DIR, { recursive: true, force: true });
    await rm(TEST_BACKUP_DIR, { recursive: true, force: true });
  });

  it('deve salvar e carregar dados corretamente', async () => {
    const testData = {
      id: '1',
      name: 'Test',
      value: 42
    };

    await db.save('test', testData);
    const loaded = await db.load<typeof testData>('test');

    expect(loaded).toEqual(testData);
  });

  it('deve retornar null ao tentar carregar coleção inexistente', async () => {
    const result = await db.load('inexistente');
    expect(result).toBeNull();
  });

  it('deve criar backup ao salvar dados', async () => {
    const testData = { test: true };
    await db.save('test', testData);

    // Esperar backup ser criado
    await new Promise(resolve => setTimeout(resolve, 100));

    const files = await db.listBackups('test');
    expect(files.length).toBeGreaterThan(0);
  });

  it('deve limitar número de backups', async () => {
    const testData = { test: true };

    // Criar 5 backups
    for (let i = 0; i < 5; i++) {
      await db.save('test', { ...testData, i });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const files = await db.listBackups('test');
    expect(files.length).toBeLessThanOrEqual(3); // maxBackups definido como 3
  });

  it('deve restaurar do backup em caso de erro', async () => {
    const testData = { test: true };
    await db.save('test', testData);

    // Corromper arquivo original
    await rm(join(TEST_DIR, 'test.json'));

    // Tentar carregar deve restaurar do backup
    const loaded = await db.load<typeof testData>('test');
    expect(loaded).toEqual(testData);
  });

  it('deve falhar graciosamente se não houver backup', async () => {
    const testData = { test: true };
    await db.save('test', testData);

    // Remover arquivo e backups
    await rm(join(TEST_DIR, 'test.json'));
    await rm(TEST_BACKUP_DIR, { recursive: true, force: true });
    await mkdir(TEST_BACKUP_DIR);

    const loaded = await db.load('test');
    expect(loaded).toBeNull();
  });
});