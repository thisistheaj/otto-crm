declare module 'langsmith' {
  interface RunEvent {
    name: string;
    data?: Record<string, any>;
  }

  interface RunUpdate {
    events?: RunEvent[];
    outputs?: Record<string, any>;
    error?: string;
    end_time?: number;
  }

  interface CreateRunParams {
    name: string;
    run_type: 'tool' | 'chain' | 'llm';
    inputs: Record<string, any>;
  }

  interface Run {
    id: string;
  }

  interface ClientConfig {
    apiKey: string;
    projectName?: string;
    endpoint?: string;
  }

  export class Client {
    constructor(config: ClientConfig);
    createRun(params: CreateRunParams): Promise<Run>;
    updateRun(runId: string, update: RunUpdate): Promise<void>;
  }
} 