import { mkdir, writeFile, readFile, copyFile, unlink, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

interface DatabaseConfig {
  dataDir: string;
  backupDir: string;
  backupInterval: number;
  maxBackups: number;
}

interface DatabaseOptions {
  prettyPrint?: boolean;
  compression?: boolean;
  validateSchema?: boolean;
}

export class DatabaseService {
  private dataDir: string;
  private backupDir: string;
  private backupInterval: number;
  private maxBackups: number;
  private options: DatabaseOptions;

  constructor(config: DatabaseConfig, options: DatabaseOptions = {}) {
    this.dataDir = config.dataDir;
    this.backupDir = config.backupDir;
    this.backupInterval = config.backupInterval;
    this.maxBackups = config.maxBackups;
    this.options = {
      prettyPrint: true,
      compression: false,
      validateSchema: true,
      ...options
    };

    // Criar diretórios imediatamente no construtor
    this.ensureDirectoriesSync();
  }

  private ensureDirectoriesSync(): void {
    const fs = require('node:fs');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async save<T>(collection: string, data: T): Promise<void> {
    try {
      // Garantir que os diretórios existem antes de cada operação
      await this.ensureDirectories();

      const filePath = this.getFilePath(collection);
      const jsonData = this.options.prettyPrint 
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      // Criar backup antes de salvar
      await this.createBackup(collection);
      
      // Salvar dados
      await writeFile(filePath, jsonData, 'utf8');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao salvar ${collection}:`, error);
      throw new Error(`Falha ao salvar dados em ${collection}: ${message}`);
    }
  }

  async load<T>(collection: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(collection);
      
      // Verificar se arquivo existe
      try {
        await stat(filePath);
      } catch {
        return null;
      }

      // Carregar dados
      const jsonData = await readFile(filePath, 'utf8');
      const data = JSON.parse(jsonData) as T;

      // Validar schema se necessário
      if (this.options.validateSchema) {
        // TODO: Implementar validação de schema
      }

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao carregar ${collection}:`, error);
      
      // Tentar restaurar do backup
      const restored = await this.restoreFromBackup(collection);
      if (restored) {
        return await this.load<T>(collection);
      }

      throw new Error(`Falha ao carregar dados de ${collection}: ${message}`);
    }
  }

  async createBackup(collection: string): Promise<void> {
    try {
      const sourceFile = this.getFilePath(collection);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = join(this.backupDir, `${collection}_${timestamp}.json`);

      // Verificar se arquivo fonte existe
      try {
        await stat(sourceFile);
      } catch {
        return; // Se arquivo não existe, não criar backup
      }

      // Copiar arquivo atual para backup
      await copyFile(sourceFile, backupFile);

      // Limpar backups antigos
      await this.cleanOldBackups(collection);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao criar backup de ${collection}:`, message);
    }
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await mkdir(this.dataDir, { recursive: true });
      await mkdir(this.backupDir, { recursive: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro ao criar diretórios:', message);
      throw new Error(`Falha ao criar diretórios necessários: ${message}`);
    }
  }

  async listBackups(collection: string): Promise<string[]> {
    try {
      await this.ensureDirectories();
      const files = await readdir(this.backupDir);
      const backups = files
        .filter(file => file.startsWith(`${collection}_`) && file.endsWith('.json'))
        .map(file => join(this.backupDir, file));

      // Ordenar por data (mais recente primeiro)
      return backups.sort().reverse();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao listar backups de ${collection}:`, message);
      return [];
    }
  }

  private async restoreFromBackup(collection: string): Promise<boolean> {
    try {
      const backups = await this.listBackups(collection);
      if (backups.length === 0) return false;

      // Pegar backup mais recente
      const latestBackup = backups[0];
      const targetFile = this.getFilePath(collection);

      // Restaurar do backup
      await copyFile(latestBackup, targetFile);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao restaurar backup de ${collection}:`, message);
      return false;
    }
  }

  private async cleanOldBackups(collection: string): Promise<void> {
    try {
      const backups = await this.listBackups(collection);
      if (backups.length <= this.maxBackups) return;

      // Remover backups mais antigos
      const toRemove = backups.slice(this.maxBackups);
      for (const backup of toRemove) {
        await unlink(backup);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao limpar backups antigos de ${collection}:`, message);
    }
  }

  private getFilePath(collection: string): string {
    return join(this.dataDir, `${collection}.json`);
  }
}