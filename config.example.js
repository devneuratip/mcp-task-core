// Exemplo de configuração - Renomeie para config.js
module.exports = {
  // Configurações da API
  openai: {
    apiKey: 'YOUR_OPENAI_API_KEY_HERE',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  },

  // Configurações de persistência
  storage: {
    dataDir: 'src/data',
    backupDir: 'src/backup',
    backupInterval: 5 * 60 * 1000, // 5 minutos
    maxBackups: 10
  },

  // Configurações do servidor
  server: {
    port: 3000,
    host: 'localhost'
  },

  // Configurações de logging
  logging: {
    level: 'info',
    file: 'logs/mcp.log'
  }
};