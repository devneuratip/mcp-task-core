import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  {
    name: 'coordinate_task',
    description: 'Coordena a execução de uma tarefa com suporte a priorização e autonomia',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Identificador único da tarefa'
        },
        taskType: {
          type: 'string',
          description: 'Tipo da tarefa a ser executada'
        },
        params: {
          type: 'object',
          description: 'Parâmetros adicionais para a tarefa'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Prioridade de execução da tarefa'
        },
        autonomyLevel: {
          type: 'string',
          enum: ['none', 'low', 'medium', 'full'],
          description: 'Nível de autonomia da tarefa'
        },
        metrics: {
          type: 'object',
          properties: {
            modelPerformance: {
              type: 'object',
              description: 'Métricas de performance do modelo',
              properties: {
                accuracy: {
                  type: 'number',
                  description: 'Precisão do modelo (0-1)'
                },
                latency: {
                  type: 'number', 
                  description: 'Latência em ms'
                },
                tokenUsage: {
                  type: 'number',
                  description: 'Tokens utilizados'
                }
              }
            }
          }
        }
      },
      required: ['taskId', 'taskType']
    }
  },
  {
    name: 'add_task_sequence',
    description: 'Adiciona uma nova sequência de tarefas com configurações avançadas',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'Lista de tarefas a serem executadas em sequência',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'Tipo da tarefa'
              },
              params: {
                type: 'object',
                description: 'Parâmetros da tarefa'
              }
            },
            required: ['type']
          }
        },
        config: {
          type: 'object',
          description: 'Configurações avançadas da sequência',
          properties: {
            autonomyLevel: {
              type: 'string',
              enum: ['none', 'low', 'medium', 'full'],
              description: 'Nível de autonomia da sequência'
            },
            minExecutionTime: {
              type: 'number',
              description: 'Tempo mínimo de execução em ms'
            },
            maxExecutionTime: {
              type: 'number',
              description: 'Tempo máximo de execução em ms'
            },
            autoEvolution: {
              type: 'object',
              properties: {
                enabled: {
                  type: 'boolean',
                  description: 'Habilita evolução automática'
                },
                minThoughts: {
                  type: 'number',
                  description: 'Mínimo de pensamentos por tarefa'
                },
                maxThoughts: {
                  type: 'number',
                  description: 'Máximo de pensamentos por tarefa'
                },
                thoughtInterval: {
                  type: 'number',
                  description: 'Intervalo entre pensamentos em ms'
                },
                qualityThreshold: {
                  type: 'number',
                  description: 'Limiar de qualidade para evolução'
                }
              }
            },
            validation: {
              type: 'object',
              properties: {
                required: {
                  type: 'boolean',
                  description: 'Se validação é obrigatória'
                },
                minConfidence: {
                  type: 'number',
                  description: 'Confiança mínima para validação'
                },
                autoFix: {
                  type: 'boolean',
                  description: 'Correção automática de problemas'
                }
              }
            }
          },
          required: ['autonomyLevel']
        }
      },
      required: ['tasks']
    }
  },
  {
    name: 'add_thought',
    description: 'Adiciona um pensamento a uma tarefa em execução',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'ID da tarefa'
        },
        thought: {
          type: 'string',
          description: 'Conteúdo do pensamento'
        },
        quality: {
          type: 'number',
          description: 'Qualidade do pensamento (0-1)'
        }
      },
      required: ['taskId', 'thought']
    }
  },
  {
    name: 'complete_current_task',
    description: 'Marca a tarefa atual como concluída',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceId: {
          type: 'string',
          description: 'ID da sequência'
        },
        result: {
          type: 'object',
          description: 'Resultado da tarefa'
        }
      },
      required: ['sequenceId']
    }
  },
  {
    name: 'get_sequence_status',
    description: 'Obtém o status atual da sequência de tarefas',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceId: {
          type: 'string',
          description: 'ID da sequência'
        }
      },
      required: ['sequenceId']
    }
  },
  {
    name: 'optimize_performance',
    description: 'Otimiza performance do sistema',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['speed', 'accuracy', 'resources'],
          description: 'Alvo da otimização'
        },
        mode: {
          type: 'string',
          description: 'Modo de operação'
        },
        switchInterval: {
          type: 'number',
          description: 'Intervalo de alternância em ms'
        }
      },
      required: ['target']
    }
  }
];