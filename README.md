# MCP Task Core

Implementação de servidor MCP (Model Context Protocol) para gerenciamento de tarefas e integração com ferramentas.

## Funcionalidades

- Gerenciamento de tarefas e workflows
- Integração com APIs externas
- Suporte a múltiplas ferramentas MCP
- Sistema de cache e otimização de requisições
- Gerenciamento de tokens e autenticação

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/devneuratip/mcp-task-core.git
cd mcp-task-core
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo de configuração:
```bash
cp config.example.js config.js
```

4. Configure suas credenciais no arquivo `config.js`

## Uso

1. Execute o servidor em modo desenvolvimento:
```bash
npm run dev
```

2. Para build de produção:
```bash
npm run build
```

3. Para executar os testes:
```bash
npm test
```

## Estrutura do Projeto

```
src/
├── __tests__/        # Testes unitários
├── sdk-mock/         # Mock do SDK MCP
├── services/         # Serviços principais
├── types/           # Definições de tipos
└── utils/           # Utilitários
```

## Documentação

- [Integração com Roo](docs/roo-code-integration.md)
- [Exemplos de Workflow](examples/workflow-example.md)

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.