import { apiManager } from './api-config.js';
import type { TaskData, TaskHandlerArgs } from './types.js';

export class TaskHandler {
  async handleTask(args: TaskHandlerArgs) {
    const { action, taskData } = args;

    switch (action) {
      case 'add_sequence': {
        return await this.handleAddSequence(taskData);
      }
      case 'coordinate': {
        return await this.handleCoordinate(taskData);
      }
      case 'generate': {
        return await this.handleGenerate(taskData);
      }
      default: {
        throw new Error(`Ação desconhecida: ${action}`);
      }
    }
  }

  private async handleAddSequence(taskData: TaskData) {
    const prompt = `
Desenvolver um plano detalhado para: ${taskData.description}

Analise as seguintes etapas e expanda cada uma com detalhes de implementação, considerações técnicas e melhores práticas:

${taskData.steps?.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Por favor, forneça uma análise detalhada e estruturada de cada etapa, incluindo:
- Objetivos específicos
- Implementação técnica
- Considerações de segurança e escalabilidade
- Pontos de atenção e melhores práticas
`;

    try {
      const response = await apiManager.handleRequest(prompt);
      console.log('[DEBUG] response.text:', response.text); // Log do conteúdo de response.text
      return response.text;

    } catch (error) {
      console.error('Erro ao processar a sequência:', error);
      throw error;
    }
  }

  private async handleCoordinate(taskData: TaskData) {
    const prompt = `
Coordenar a implementação do projeto: ${taskData.description}

Forneça um plano detalhado de coordenação para as seguintes etapas:
${taskData.steps?.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Para cada etapa, especifique:
- Dependências e pré-requisitos
- Recursos necessários
- Pontos de integração
- Riscos e mitigações
- Critérios de aceitação
`;

    try {
      const response = await apiManager.handleRequest(prompt);
      console.log('[DEBUG] response.text:', response.text);
      return response.text;

    } catch (error) {
      console.error('Erro ao coordenar o projeto:', error);
      throw error;
    }
  }

  private async handleGenerate(taskData: TaskData) {
    const prompt = `
Gerar novas tarefas relacionadas a: ${taskData.description}

Com base nas seguintes etapas:
${taskData.steps?.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Por favor, forneça:
- Tarefas adicionais relacionadas
- Dependências entre tarefas
- Estimativas de complexidade
- Requisitos técnicos
- Recomendações de implementação
`;

    try {
      const response = await apiManager.handleRequest(prompt);
      console.log('[DEBUG] response.text:', response.text);
      return response.text;

    } catch (error) {
      console.error('Erro ao gerar tarefas:', error);
      throw error;
    }
  }
}

export const taskHandler = new TaskHandler();