import ky from 'ky';
import { z } from 'zod';
import { validateSonarKey, isValidSonarKey } from './utils';
import { ConfigSchema, ServicesSchema, PayloadSchema } from './types';
import type { EventConfig, Services, PayloadFunction,WorkflowEventMap, WorkflowDefinition,Config } from './types';

// workflow.ts
class Workflow<T extends WorkflowEventMap> {
  private readonly events: WorkflowDefinition<T>['events'] = {} as WorkflowDefinition<T>['events'];
  private readonly baseUrl: string;
  private projectId: string;
  private apiKey: string;
  private emitQueue: Promise<any> = Promise.resolve();

  constructor(private readonly name: string) {
    const apiKey = process.env.SONAR_API_KEY;
    const projectId = process.env.SONAR_PROJECT_ID;
    const baseUrl = process.env.SONAR_BASE_URL;

    if (!baseUrl || !apiKey || !projectId) {
      throw new Error('Missing required environment variables');
    }

    if (!isValidSonarKey(apiKey, 'apiKey')) {
      const validation = validateSonarKey(apiKey, 'apiKey');
      throw new Error(
        `Invalid SONAR_API_KEY format: ${validation.message}`
      );
    }

    if (!isValidSonarKey(projectId, 'projectId')) {
      const validation = validateSonarKey(projectId, 'projectId');
      throw new Error(
        `Invalid SONAR_PROJECT_ID format: ${validation.message}`
      );
    }

    this.projectId = projectId;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  on<K extends keyof T>(
    eventName: K,
    config: Config & { schema?: T[K]['schema'] },
    payloadFn: PayloadFunction<T[K]['data']>,
    services: Services
  ): {
    next: <NextK extends string>(
      nextEventName: NextK,
      nextFn?: (data: T[K]['data']) => void | Promise<void>
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
        nextFn?: (data: T[K]['data']) => void | Promise<void>
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
    data: T[K]['data'];
  }) {
    this.emitQueue = this.emitQueue.then(() => this.emitEvent(params));
    return this.emitQueue;
  }

  private async emitEvent<K extends keyof T>(params: {
    event: K;
    data: T[K]['data'];
  }) {
    const eventConfig = this.events[params.event];
    if (!eventConfig) {
      throw new Error(`Event ${String(params.event)} not registered`);
    }

    if (eventConfig.schema) {
      eventConfig.schema.parse(params.data);
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
 
 */


/**
 * Creates a new workflow instance
 * @param name - The name of the workflow
 * @throws {WorkflowConfigError} When configuration is invalid
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
 * // Usage:
 * await myWorkflow.emit({ event: 'start', data: { userId: '123' } });
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
