import { join } from 'node:path';
import type { Priority, TaskStatus, Thought } from './types.js';
import { DatabaseService } from './services/database.js';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  steps?: Array<{
    id: string;
    description: string;
    status: TaskStatus;
  }>;
  createdAt: string;
  updatedAt: string;
}

class TaskStore {
  private db: DatabaseService;
  private tasksCache: Map<string, Task>;
  private thoughtsCache: Map<string, Thought>;
  
  constructor() {
    // Configurar DatabaseService
    this.db = new DatabaseService({
      dataDir: join(process.cwd(), 'src', 'data'),
      backupDir: join(process.cwd(), 'src', 'backup'),
      backupInterval: 5 * 60 * 1000, // 5 minutos
      maxBackups: 10
    });

    this.tasksCache = new Map();
    this.thoughtsCache = new Map();

    // Carregar dados do disco
    this.initialize().catch(console.error);
  }

  private async initialize(): Promise<void> {
    try {
      // Carregar tarefas
      const tasks = await this.db.load<Task[]>('tasks') || [];
      for (const task of tasks) {
        this.tasksCache.set(task.id, task);
      }

      // Carregar pensamentos
      const thoughts = await this.db.load<Thought[]>('thoughts') || [];
      for (const thought of thoughts) {
        const thoughtId = `thought_${thought.timestamp}`;
        this.thoughtsCache.set(thoughtId, thought);
      }

      console.log(`[TaskStore] Inicializado com ${tasks.length} tarefas e ${thoughts.length} pensamentos`);
    } catch (error) {
      console.error('[TaskStore] Erro ao inicializar:', error);
    }
  }

  private async persistTasks(): Promise<void> {
    try {
      const tasks = Array.from(this.tasksCache.values());
      await this.db.save('tasks', tasks);
    } catch (error) {
      console.error('[TaskStore] Erro ao persistir tarefas:', error);
    }
  }

  private async persistThoughts(): Promise<void> {
    try {
      const thoughts = Array.from(this.thoughtsCache.values());
      await this.db.save('thoughts', thoughts);
    } catch (error) {
      console.error('[TaskStore] Erro ao persistir pensamentos:', error);
    }
  }

  // Task Methods
  async createTask(title: string, description: string, priority: Priority = 'medium', steps?: string[]): Promise<Task> {
    const taskId = `task_${Date.now()}`;
    const task: Task = {
      id: taskId,
      title,
      description,
      priority,
      status: 'pending',
      steps: steps?.map((step, index) => ({
        id: `step_${taskId}_${index}`,
        description: step,
        status: 'pending'
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasksCache.set(taskId, task);
    await this.persistTasks();
    return task;
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasksCache.get(taskId);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, note?: string): Promise<Task | undefined> {
    const task = this.tasksCache.get(taskId);
    if (!task) return undefined;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    this.tasksCache.set(taskId, task);
    await this.persistTasks();

    if (note) {
      await this.addThought({
        content: note,
        taskId,
        tags: ['status-update']
      });
    }

    return task;
  }

  async updateStepStatus(taskId: string, stepId: string, status: TaskStatus, note?: string): Promise<Task | undefined> {
    const task = this.tasksCache.get(taskId);
    if (!task || !task.steps) return undefined;

    const step = task.steps.find(s => s.id === stepId);
    if (!step) return undefined;

    step.status = status;
    task.updatedAt = new Date().toISOString();
    this.tasksCache.set(taskId, task);
    await this.persistTasks();

    if (note) {
      await this.addThought({
        content: note,
        taskId,
        tags: ['step-update']
      });
    }

    return task;
  }

  async getAllTasks(includeCompleted = false): Promise<Task[]> {
    return Array.from(this.tasksCache.values())
      .filter(task => includeCompleted || task.status !== 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Thought Methods
  async addThought(thought: Thought): Promise<Thought> {
    const timestamp = thought.timestamp || new Date().toISOString();
    const newThought = {
      ...thought,
      timestamp
    };

    const thoughtId = `thought_${timestamp}`;
    this.thoughtsCache.set(thoughtId, newThought);
    await this.persistThoughts();
    return newThought;
  }

  async getThoughtsByTask(taskId: string): Promise<Thought[]> {
    return Array.from(this.thoughtsCache.values())
      .filter(thought => thought.taskId === taskId)
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }

  async getAllThoughts(): Promise<Thought[]> {
    return Array.from(this.thoughtsCache.values())
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }

  // Summary Methods
  async getDevelopmentSummary(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    blockedTasks: number;
    thoughts: number;
    recentActivity: Array<{ timestamp: string; action: string }>;
  }> {
    const now = new Date();
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = new Date(now.getTime() - timeframes[timeframe]);

    const tasks = Array.from(this.tasksCache.values())
      .filter(task => new Date(task.updatedAt) >= cutoff);

    const thoughts = Array.from(this.thoughtsCache.values())
      .filter(thought => thought.timestamp && new Date(thought.timestamp) >= cutoff);

    const activity = [
      ...tasks.map(task => ({
        timestamp: task.updatedAt,
        action: `Task "${task.title}" status changed to ${task.status}`
      })),
      ...thoughts.map(thought => ({
        timestamp: thought.timestamp || new Date().toISOString(),
        action: `New thought added${thought.taskId ? ` for task ${thought.taskId}` : ''}`
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      blockedTasks: tasks.filter(t => t.status === 'blocked').length,
      thoughts: thoughts.length,
      recentActivity: activity
    };
  }

  // Reminder Methods
  async getPendingTaskReminders(filter: 'all' | 'pending' | 'blocked' = 'all'): Promise<Array<{
    taskId: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    daysInactive: number;
  }>> {
    const now = new Date();
    return Array.from(this.tasksCache.values())
      .filter(task => {
        if (filter === 'pending') return task.status === 'pending';
        if (filter === 'blocked') return task.status === 'blocked';
        return task.status !== 'completed';
      })
      .map(task => ({
        taskId: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        daysInactive: Math.floor((now.getTime() - new Date(task.updatedAt).getTime()) / (24 * 60 * 60 * 1000))
      }))
      .sort((a, b) => b.daysInactive - a.daysInactive);
  }
}

export const taskStore = new TaskStore();