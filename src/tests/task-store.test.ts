import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { taskStore } from '../task-store.js';
import type { Task, Thought } from '../types.js';

interface TestableTaskStore {
  tasksCache: Map<string, Task>;
  thoughtsCache: Map<string, Thought>;
}

const TEST_DIR = join(process.cwd(), 'src', 'data');
const TEST_BACKUP_DIR = join(process.cwd(), 'src', 'backup');

describe('TaskStore', () => {
  beforeEach(async () => {
    // Limpar dados de teste anteriores
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
      await rm(TEST_BACKUP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error('Erro ao limpar diretórios de teste:', error);
    }

    // Resetar o estado do taskStore
    ((taskStore as unknown) as TestableTaskStore).tasksCache = new Map();
    ((taskStore as unknown) as TestableTaskStore).thoughtsCache = new Map();
  });

  afterEach(async () => {
    // Limpar dados após os testes
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
      await rm(TEST_BACKUP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error('Erro ao limpar diretórios de teste:', error);
    }
  });

  it('deve criar uma nova tarefa', async () => {
    const task = await taskStore.createTask(
      'Teste',
      'Descrição de teste',
      'medium',
      ['Passo 1', 'Passo 2']
    );

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Teste');
    expect(task.description).toBe('Descrição de teste');
    expect(task.priority).toBe('medium');
    expect(task.status).toBe('pending');
    expect(task.steps).toHaveLength(2);

    // Verificar persistência
    const tasks = await taskStore.getAllTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task.id);
  });

  it('deve recuperar uma tarefa existente', async () => {
    const created = await taskStore.createTask('Teste', 'Descrição');
    const retrieved = await taskStore.getTask(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.title).toBe('Teste');
  });

  it('deve atualizar o status de uma tarefa', async () => {
    const task = await taskStore.createTask('Teste', 'Descrição');
    const updated = await taskStore.updateTaskStatus(task.id, 'in_progress');

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('in_progress');

    // Verificar persistência
    const retrieved = await taskStore.getTask(task.id);
    expect(retrieved?.status).toBe('in_progress');
  });

  it('deve atualizar o status de um passo da tarefa', async () => {
    const task = await taskStore.createTask('Teste', 'Descrição', 'medium', ['Passo 1']);
    const stepId = task.steps?.[0].id;

    if (!stepId) {
      throw new Error('Step ID não encontrado');
    }

    const updated = await taskStore.updateStepStatus(task.id, stepId, 'completed');

    expect(updated).toBeDefined();
    expect(updated?.steps?.[0].status).toBe('completed');

    // Verificar persistência
    const retrieved = await taskStore.getTask(task.id);
    expect(retrieved?.steps?.[0].status).toBe('completed');
  });

  it('deve registrar um pensamento', async () => {
    const thought = await taskStore.addThought({
      content: 'Teste de pensamento',
      tags: ['teste']
    });

    expect(thought.content).toBe('Teste de pensamento');
    expect(thought.timestamp).toBeDefined();

    // Verificar persistência
    const thoughts = await taskStore.getAllThoughts();
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0].content).toBe('Teste de pensamento');
  });

  it('deve vincular um pensamento a uma tarefa', async () => {
    const task = await taskStore.createTask('Teste', 'Descrição');
    const thought = await taskStore.addThought({
      content: 'Pensamento vinculado',
      taskId: task.id,
      tags: ['teste']
    });

    const thoughts = await taskStore.getThoughtsByTask(task.id);
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0].content).toBe('Pensamento vinculado');
    expect(thoughts[0].taskId).toBe(task.id);
  });

  it('deve retornar resumo do desenvolvimento', async () => {
    // Criar exatamente duas tarefas
    await taskStore.createTask('Tarefa 1', 'Descrição 1');
    const task2 = await taskStore.createTask('Tarefa 2', 'Descrição 2');
    await taskStore.updateTaskStatus(task2.id, 'completed');
    await taskStore.addThought({ content: 'Pensamento 1' });

    const summary = await taskStore.getDevelopmentSummary('day');

    expect(summary.totalTasks).toBe(2);
    expect(summary.completedTasks).toBe(1);
    expect(summary.pendingTasks).toBe(1);
    expect(summary.thoughts).toBe(1);
  });

  it('deve retornar lembretes de tarefas pendentes', async () => {
    // Criar exatamente duas tarefas
    await taskStore.createTask('Tarefa 1', 'Descrição 1');
    const task2 = await taskStore.createTask('Tarefa 2', 'Descrição 2');
    await taskStore.updateTaskStatus(task2.id, 'blocked');

    const reminders = await taskStore.getPendingTaskReminders('all');
    expect(reminders).toHaveLength(2);

    const blockedReminders = await taskStore.getPendingTaskReminders('blocked');
    expect(blockedReminders).toHaveLength(1);
    expect(blockedReminders[0].status).toBe('blocked');
  });
});