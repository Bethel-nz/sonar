import ky from 'ky';
import { z } from 'zod';
import { validateSonarKey, isValidSonarKey } from './utils';
import { ConfigSchema, ServicesSchema, PayloadSchema } from './types';
import type { EventConfig, Services, PayloadFunction,WorkflowEventMap, WorkflowDefinition,Config } from './types';

// workflow.ts
class Workflow<T extends WorkflowEventMap> {
  private readonly events: WorkflowDefinition<T>['events'] = {} as WorkflowDefinition<T>['events'];
  private readonly baseUrl = 'http://localhost:5390'; //<- hardcoded for now
  private projectId: string;
  private apiKey: string;
  private emitQueue: Promise<any> = Promise.resolve();

  constructor(private readonly name: string) {
    const apiKey = process.env.SONAR_API_KEY!;
    const projectId = process.env.SONAR_PROJECT_ID!;

    if (!apiKey || !isValidSonarKey(apiKey, 'apiKey')) {
      const validation = validateSonarKey(apiKey, 'apiKey');
      console.error(`
        ${
          validation.message ||
          'SONAR API KEY IS INVALID OR MISSING FROM .env!!'
        }
      `);
    }

    if (!projectId || !isValidSonarKey(projectId, 'projectId')) {
      const validation = validateSonarKey(projectId, 'projectId');
      console.error(`
        
        ${
          validation.message ||
          'SONAR PROJECT ID IS INVALID OR MISSING FROM .env!!'
        }
      `);
    }

    this.projectId = projectId;
    this.apiKey = apiKey;
  }
  on<K extends keyof T>(
    eventName: K,
    config: Config & { schema: T[K]['schema'] },
    payloadFn: PayloadFunction<z.infer<T[K]['schema']>>,
    services: Services
  ): {
    next: <NextK extends string>(
      nextEventName: NextK,
      nextFn?: (data: z.infer<T[K]['schema']>) => void | Promise<void>
    ) => void;
  } {
    ConfigSchema.parse(config);
    ServicesSchema.parse(services);

    this.events[eventName] = {
      config,
      schema: config.schema,
      services: services.service,
      payloadFn,
    };

    return {
      next: <NextK extends string>(
        nextEventName: NextK,
        nextFn?: (data: ReturnType<PayloadFunction<z.infer<T[K]['schema']>>>) => void | Promise<void>
      ) => {
        this.events[eventName].nextEvent = nextEventName;
        if (nextFn) {
          this.events[eventName].onNextEvent = nextFn;
          
        }
      },
    };
  }

  async emit<K extends keyof T>(params: {
    event: K;
    data: z.infer<T[K]['schema']>;
  }) {
    this.emitQueue = this.emitQueue.then(() => this.emitEvent(params));
    return this.emitQueue;
  }

  private async emitEvent<K extends keyof T>(params: {
    event: K;
    data: z.infer<T[K]['schema']>;
  }) {
    const eventConfig = this.events[params.event];
    if (!eventConfig) {
      throw new Error(`Event ${String(params.event)} not registered`);
    }

    const { config, payloadFn, services, nextEvent, onNextEvent } = eventConfig;
    const { schema, ...configWithoutSchema } = config;

    const transformedPayload = payloadFn(params.data);

    const requestBody = {
      event: params.event,
      config: configWithoutSchema,
      payload: transformedPayload,
      services,
      nextEvent: nextEvent || null,
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/projects/${this.projectId}/workflows/${this.name}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `SONAR_API_KEY ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error:', errorData);
        throw new Error(`Server returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log(`✅ Event ${String(params.event)} emitted successfully:`, result);
      return result;
    } catch (error) {
      console.error(
        `❌ Error emitting event "${String(params.event)}" for workflow "${this.name}":`,
        error
      );
      throw error;
    } finally {
      // Execute onNextEvent callback if it exists, regardless of SDK success/failure
      if (onNextEvent) {
        try {
          await onNextEvent(params.data);
        } catch (callbackError) {
          console.error('Error in next event callback:', callbackError);
        }
      }
    }
  }
}

/**
 * Creates and configures a new workflow instance.
 *
 * This function allows you to define a workflow with strongly-typed events and their corresponding data structures.
 * It provides a fluent interface for setting up event handlers and their configurations.
 *
 * @param name - The name of the workflow.
 * @param setup - A function that configures the workflow by adding event handlers.
 * @returns A configured Workflow instance.
 *
 * @example
 * ```typescript
 * const myWorkflow = workflow('MyWorkflow', (wf) => {
 *   wf.on('start',
 *     {
 *       description: 'Workflow started',
 *       severity: 'info',
 *       tags: ['start'],
 *       schema: z.object({ userId: z.string() })
 *     },
 *     (data: { userId: string }) => ({ startedBy: data.userId }),
 *     { service: ['Telegram'] }
 *   ).next('process', (data: { data: string }) => {
 *     console.log(`Processing data: ${data.data}`);
 *   });
 *
 *   wf.on('process',
 *     {
 *       description: 'Processing data',
 *       severity: 'info',
 *       tags: ['process']
 *     },
 *     (data: { data: string }) => ({ processedData: data.data }),
 *     { service: ['Discord'] }
 *   );
 *
 *   wf.on('end',
 *     {
 *       description: 'Workflow ended',
 *       severity: 'info',
 *       tags: ['end']
 *     },
 *     (data: { success: boolean }) => ({ result: data.success ? 'Success' : 'Failure' }),
 *     { service: ['Telegram', 'Discord'] }
 *   );
 * });
 *
 * // Usage:
 * await myWorkflow.emit({ event: 'start', data: { userId: '123' } });
 * await myWorkflow.emit({ event: 'process', data: { data: 'some data' } });
 * await myWorkflow.emit({ event: 'end', data: { success: true } });
 * ```
 */


export function workflow<T extends WorkflowEventMap>(
  name: string,
  setup: (wf: Workflow<T>) => void
): Workflow<T> {
  const instance = new Workflow<T>(name);
  setup(instance);
  return instance;
}
