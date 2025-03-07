// Mock do SDK para desenvolvimento
export class Server {
  private handlers: Map<symbol, (request: McpRequest) => Promise<McpResponse>>;
  public onerror?: (error: Error) => void;

  constructor(
    private info: { name: string; version: string },
    private config: { capabilities: { tools: unknown } }
  ) {
    this.handlers = new Map();
  }

  async connect(transport: StdioServerTransport): Promise<void> {
    await transport.connect();
  }
  
  setRequestHandler(
    schema: symbol,
    handler: (request: McpRequest) => Promise<McpResponse>
  ): void {
    this.handlers.set(schema, handler);
  }

  async close(): Promise<void> {
    // Mock implementation
  }
}

export class StdioServerTransport {
  private connected: boolean;

  constructor() {
    this.connected = false;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

export enum ErrorCode {
  InvalidParams = 'INVALID_PARAMS',
  MethodNotFound = 'METHOD_NOT_FOUND',
  InternalError = 'INTERNAL_ERROR'
}

export class McpError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = code;
  }
}

export const ListToolsRequestSchema = Symbol('ListToolsRequestSchema');
export const CallToolRequestSchema = Symbol('CallToolRequestSchema');

export interface McpRequest {
  params: {
    name: string;
    arguments: unknown;
  };
}

export interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}