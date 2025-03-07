import type { RequestOptions } from './api-config.js';

export interface ApiClient {
  complete(prompt: string, options?: RequestOptions): Promise<CompletionResult>;
}

export type TaskType = string;
export type ComplexityLevel = 'low' | 'medium' | 'high';
export type ResponseSize = 'short' | 'medium' | 'long';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type Priority = 'low' | 'medium' | 'high';
export type AutonomyLevel = 'none' | 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
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

export interface Thought {
  content: string;
  taskId?: string;
  tags?: string[];
  timestamp?: string;
}

export interface CompletionRequest {
  prompt: string;
  options?: RequestOptions;
}

export interface CompletionResult {
  text: string;
  provider: string;
  model: string;
  metrics?: SystemMetrics;
}

export interface SystemMetrics {
  latency: number;
  tokens: number;
  provider?: string;
}

export interface ApiResponsePayload {
  choices?: Array<{
    message: {
      content: string;
    };
  }>;
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  text?: string;
  content?: string;
  error?: {
    message: string;
    code?: string | number;
  };
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface TaskHandlerArgs {
  action: 'coordinate' | 'add_sequence' | 'generate';
  taskData: {
    description: string;
    steps?: string[];
    priority?: Priority;
  };
  autonomyLevel?: AutonomyLevel;
}

export interface CompletionArgs {
  action: 'complete' | 'handle_request' | 'add_thought';
  prompt: string;
  options?: RequestOptions;
}

export interface CreateTaskArgs {
  title: string;
  description: string;
  steps?: string[];
  priority?: Priority;
}

export interface ProcessTaskArgs {
  taskId: string;
  type?: string;
  params?: Record<string, unknown>;
}

export interface ErrorReportArgs {
  error_report: string;
}

export interface TaskData {
  description: string;
  steps?: string[];
  priority?: Priority;
}

export interface AddThoughtArgs {
  content: string;
  taskId?: string;
  tags?: string[];
}

export interface TrackProgressArgs {
  taskId: string;
  stepId?: string;
  status: TaskStatus;
  note?: string;
}

export interface GetTaskSummaryArgs {
  includeCompleted?: boolean;
}

export interface GetDevelopmentSummaryArgs {
  timeframe?: 'day' | 'week' | 'month';
  includeMetrics?: boolean;
}

export interface RemindTasksArgs {
  filter?: 'all' | 'pending' | 'blocked';
}

export interface McpArguments {
  arguments?: 
    | TaskHandlerArgs 
    | CompletionArgs 
    | CreateTaskArgs 
    | ProcessTaskArgs 
    | ErrorReportArgs
    | AddThoughtArgs
    | TrackProgressArgs
    | GetTaskSummaryArgs
    | GetDevelopmentSummaryArgs
    | RemindTasksArgs;
  modelControl?: {
    preferredModel?: string;
    autoSwitch?: boolean;
    forceProvider?: string;
  };
}