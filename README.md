# MCP Task Core

Sistema de gerenciamento de tarefas com persistência, backups automáticos e ferramentas avançadas para desenvolvimento.

## Requisitos do Sistema

- Node.js 16.x ou superior
- VS Code com extensão Roo Code instalada
- Git (opcional, apenas para desenvolvimento)

## Instalação

1. **Preparação**:
   ```bash
   # Clone o repositório (ou baixe o ZIP)
   git clone https://github.com/devneuratip/mcp-task-core.git
   cd mcp-task-core

   # Instale as dependências
   npm install
   ```

2. **Instalação do MCP**:
   ```bash
   # Execute o script de instalação
   node install.js
   ```

3. **Verificação**:
   - Reinicie o VS Code
   - Abra a paleta de comandos (Ctrl+Shift+P)
   - Digite "Roo: List MCP Servers"
   - Verifique se "task-core" aparece na lista

## Resolução de Problemas

1. **Erro "spawn EINVAL"**:
   - Verifique se o Node.js está instalado corretamente
   - Confirme que o caminho do Node.js está no PATH do sistema
   - Execute o VS Code como administrador

2. **VS Code em OneDrive**:
   - Se o VS Code estiver instalado em uma pasta do OneDrive, considere:
     - Reinstalar o VS Code em um diretório local (ex: C:\Program Files)
     - Ou usar caminhos absolutos no arquivo de configuração

3. **Problemas de Permissão**:
   - Execute o VS Code como administrador
   - Verifique as permissões da pasta de instalação
   - Certifique-se de que o usuário tem acesso de escrita aos diretórios necessários

4. **Timeout na Inicialização**:
   - Aumente o timeout no arquivo de configuração
   - Verifique os logs do VS Code (Help > Toggle Developer Tools)
   - Certifique-se de que o firewall não está bloqueando a comunicação

## Ferramentas Disponíveis

1. **create_task**
   - Cria novas tarefas com título, descrição e passos
   - Exemplo: `{ title: "Nova Tarefa", description: "Descrição", priority: "high" }`

2. **add_thought**
   - Registra pensamentos e insights
   - Exemplo: `{ content: "Ideia importante", tags: ["feature"] }`

3. **track_progress**
   - Atualiza status de tarefas
   - Exemplo: `{ taskId: "123", status: "in_progress", note: "Em andamento" }`

4. **get_task_summary**
   - Lista todas as tarefas
   - Exemplo: `{ includeCompleted: true }`

5. **get_development_summary**
   - Gera relatório de desenvolvimento
   - Exemplo: `{ timeframe: "week" }`

6. **remind_tasks**
   - Lista tarefas pendentes
   - Exemplo: `{ filter: "blocked" }`

## Arquivos de Configuração

1. **config.json** (configuração geral):
   ```json
   {
     "storage": {
       "dataDir": "src/data",
       "backupDir": "src/backup",
       "backupInterval": 300000
     }
   }
   ```

2. **cline_mcp_settings.json** (configuração do MCP):
   ```json
   {
     "$schema": "https://raw.githubusercontent.com/rooveterinaryinc/roo-cline/main/schemas/mcp-settings.schema.json",
     "enabled": true,
     "mcpServers": {
       "task-core": {
         "command": "node",
         "args": ["src/server.js"],
         "cwd": "${workspaceFolder}",
         "env": {
           "NODE_PATH": "${workspaceFolder}"
         }
       }
     }
   }
   ```

## Desenvolvimento

1. **Build**:
   ```bash
   npm run build
   ```

2. **Testes**:
   ```bash
   npm test
   ```

3. **Desenvolvimento Local**:
   ```bash
   npm run dev
   ```

## Suporte

Se encontrar problemas:

1. Verifique os logs:
   - VS Code: Help > Toggle Developer Tools
   - MCP: src/logs/mcp.log

2. Coleta de informações para suporte:
   ```bash
   node install.js --diagnose
   ```

3. Abra uma issue no GitHub com:
   - Log de erro completo
   - Configuração do sistema
   - Passos para reproduzir o problema

## Licença

MIT