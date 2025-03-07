#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { apiManager } from './api-config.js';
import { taskStore } from './task-store.js';
import type {
  TaskHandlerArgs,
  CompletionArgs,
  TaskData,
  McpArguments,
  ApiResponsePayload,
  ErrorReportArgs,
  CreateTaskArgs,
  AddThoughtArgs,
  TrackProgressArgs,
  GetTaskSummaryArgs,
  GetDevelopmentSummaryArgs,
  RemindTasksArgs
} from './types.js';

class TaskCore {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'task-core',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'task_handler',
          description: 'Gerencia tarefas, sequências e geração de novas tarefas',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['coordinate', 'add_sequence', 'generate']
              },
              taskData: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  steps: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high']
                  }
                },
                required: ['description']
              },
              autonomyLevel: {
                type: 'string',
                enum: ['none', 'low', 'medium', 'high']
              }
            },
            required: ['action', 'taskData']
          }
        },
        {
          name: 'completion_manager',
          description: 'Gerencia completions, requisições e pensamentos',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['complete', 'handle_request', 'add_thought']
              },
              prompt: { type: 'string' },
              options: { type: 'object' }
            },
            required: ['action', 'prompt']
          }
        },
        {
          name: 'create_task',
          description: 'Cria uma nova tarefa com título, descrição e passos opcionais',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Título da tarefa'
              },
              description: {
                type: 'string',
                description: 'Descrição detalhada da tarefa'
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Prioridade da tarefa'
              },
              steps: {
                type: 'array',
                items: { type: 'string' },
                description: 'Passos para completar a tarefa'
              }
            },
            required: ['title', 'description']
          }
        },
        {
          name: 'report_error',
          description: 'Recebe um relatório de erro e sugere soluções',
          inputSchema: {
            type: 'object',
            properties: {
              error_report: {
                type: 'string',
                description: 'Relatório de erro detalhado'
              }
            },
            required: ['error_report']
          }
        },
        {
          name: 'add_thought',
          description: 'Registra um pensamento durante o desenvolvimento',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Conteúdo do pensamento'
              },
              taskId: {
                type: 'string',
                description: 'ID da tarefa relacionada (opcional)'
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags para categorizar o pensamento'
              }
            },
            required: ['content']
          }
        },
        {
          name: 'track_progress',
          description: 'Atualiza o progresso de uma tarefa ou passo',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'ID da tarefa'
              },
              stepId: {
                type: 'string',
                description: 'ID do passo (opcional)'
              },
              status: {
                type: 'string',
                enum: ['pending', 'in_progress', 'completed', 'blocked'],
                description: 'Novo status'
              },
              note: {
                type: 'string',
                description: 'Nota opcional sobre a atualização'
              }
            },
            required: ['taskId', 'status']
          }
        },
        {
          name: 'get_task_summary',
          description: 'Obtém um resumo das tarefas e seu progresso',
          inputSchema: {
            type: 'object',
            properties: {
              includeCompleted: {
                type: 'boolean',
                description: 'Incluir tarefas concluídas'
              }
            }
          }
        },
        {
          name: 'get_development_summary',
          description: 'Obtém um resumo completo do desenvolvimento',
          inputSchema: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                enum: ['day', 'week', 'month'],
                description: 'Período de tempo para o resumo'
              },
              includeMetrics: {
                type: 'boolean',
                description: 'Incluir métricas detalhadas'
              }
            }
          }
        },
        {
          name: 'remind_tasks',
          description: 'Gera um lembrete sobre tarefas pendentes',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
                enum: ['all', 'pending', 'blocked'],
                description: 'Filtro de tarefas para lembrete'
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        console.log('[DEBUG] Recebendo requisição:', JSON.stringify(request.params, null, 2));
        const mcpArgs = request.params as McpArguments;

        switch (request.params.name) {
          case 'task_handler': {
            const args = mcpArgs.arguments as TaskHandlerArgs;
            console.log('[DEBUG] Processando task_handler com args:', JSON.stringify(args, null, 2));

            const taskPrompt = `
Action: ${args.action}
Task Description: ${args.taskData.description}
Priority: ${args.taskData.priority || 'medium'}
Autonomy Level: ${args.autonomyLevel || 'medium'}
${args.taskData.steps ? `Steps:\n${args.taskData.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : ''}
`.trim();

            const response = await apiManager.handleRequest(
              taskPrompt,
              {
                temperature: 0.7,
                maxTokens: 4000
              }
            );

            console.log('[DEBUG] Resposta do provider:', JSON.stringify(response, null, 2));

            return {
              content: [
                {
                  type: 'text',
                  text: response.text,
                },
              ],
              _meta: {
                provider: response.config.provider,
                model: response.config.model,
                mode: response.currentMode,
              },
            };
          }

          case 'completion_manager': {
            const args = mcpArgs.arguments as CompletionArgs;
            console.log('[DEBUG] Processando completion_manager com args:', JSON.stringify(args, null, 2));

            const response = await apiManager.handleRequest(
              args.prompt,
              args.options
            );

            console.log('[DEBUG] Resposta do provider:', JSON.stringify(response, null, 2));

            return {
              content: [{
                type: 'text',
                text: response.text
              }],
              _meta: {
                provider: response.config.provider,
                model: response.config.model,
                mode: response.currentMode
              }
            };
          }

          case 'create_task': {
            const args = mcpArgs.arguments as CreateTaskArgs;
            console.log('[DEBUG] Criando nova tarefa:', JSON.stringify(args, null, 2));

            const taskPrompt = `
Criar nova tarefa com as seguintes informações:
Título: ${args.title}
Descrição: ${args.description}
Prioridade: ${args.priority || 'medium'}
${args.steps ? `Passos:\n${args.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : ''}

Por favor, analise a tarefa e forneça:
1. Confirmação da criação
2. Sugestões de melhorias (se houver)
3. Estimativa de complexidade
`.trim();

            const response = await apiManager.handleRequest(
              taskPrompt,
              {
                temperature: 0.7,
                maxTokens: 2000
              }
            );

            console.log('[DEBUG] Resposta do provider:', JSON.stringify(response, null, 2));

            return {
              content: [
                {
                  type: 'text',
                  text: response.text,
                },
              ],
              _meta: {
                provider: response.config.provider,
                model: response.config.model,
                mode: response.currentMode,
              },
            };
          }

          case 'report_error': {
            const args = mcpArgs.arguments as ErrorReportArgs;
            console.log('[DEBUG] Recebendo relatório de erro:', args.error_report);

            const response = await apiManager.handleRequest(
              `Sugira soluções para o seguinte relatório de erro: ${args.error_report}`,
              { temperature: 0.7 }
            );

            console.log('[DEBUG] Resposta do provider:', JSON.stringify(response, null, 2));

            return {
              content: [{ type: 'text', text: response.text }],
              _meta: {
                provider: response.config.provider,
                model: response.config.model,
                mode: response.currentMode
              }
            };
          }

          case 'add_thought': {
            const args = mcpArgs.arguments as AddThoughtArgs;
            console.log('[DEBUG] Registrando pensamento:', JSON.stringify(args, null, 2));

            const thought = taskStore.addThought(args);
            return {
              content: [{
                type: 'text',
                text: `Pensamento registrado com sucesso${args.taskId ? ` para a tarefa ${args.taskId}` : ''}.`
              }]
            };
          }

          case 'track_progress': {
            const args = mcpArgs.arguments as TrackProgressArgs;
            console.log('[DEBUG] Atualizando progresso:', JSON.stringify(args, null, 2));

            const task = args.stepId
              ? taskStore.updateStepStatus(args.taskId, args.stepId, args.status, args.note)
              : taskStore.updateTaskStatus(args.taskId, args.status, args.note);

            if (!task) {
              throw new McpError(
                ErrorCode.InvalidParams,
                `Tarefa ou passo não encontrado: ${args.taskId}${args.stepId ? `/${args.stepId}` : ''}`
              );
            }

            return {
              content: [{
                type: 'text',
                text: `Progresso atualizado com sucesso. ${args.stepId ? 'Passo' : 'Tarefa'} agora está ${args.status}.`
              }]
            };
          }

          case 'get_task_summary': {
            const args = mcpArgs.arguments as GetTaskSummaryArgs;
            console.log('[DEBUG] Obtendo resumo das tarefas:', JSON.stringify(args, null, 2));

            const tasks = taskStore.getAllTasks(args?.includeCompleted);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(tasks, null, 2)
              }]
            };
          }

          case 'get_development_summary': {
            const args = mcpArgs.arguments as GetDevelopmentSummaryArgs;
            console.log('[DEBUG] Obtendo resumo do desenvolvimento:', JSON.stringify(args, null, 2));

            const summary = taskStore.getDevelopmentSummary(args?.timeframe);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(summary, null, 2)
              }]
            };
          }

          case 'remind_tasks': {
            const args = mcpArgs.arguments as RemindTasksArgs;
            console.log('[DEBUG] Gerando lembretes de tarefas:', JSON.stringify(args, null, 2));

            const reminders = taskStore.getPendingTaskReminders(args?.filter);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(reminders, null, 2)
              }]
            };
          }

          default: {
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Tool not found: ${request.params.name}`
            );
          }
        }
      } catch (error) {
        console.error('[DEBUG] Erro durante processamento:', error);
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('Task Core MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new TaskCore();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
