// types.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  description: z.string(),
  severity: z.enum(['info', 'warn', 'error', 'critical']),
  tags: z.array(z.string()),
});

export const ServicesSchema = z.object({
  service: z.array(z.enum(['Telegram', 'Discord'])),
});

export const PayloadSchema = z.any();

export type Config = {
  description: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  tags: string[];
};

export type Services = {
  service: ('Telegram' | 'Discord')[];
};

export type PayloadFunction<T> = (data: T) => any;

// Ensure schema is always a Zod type
export type WorkflowEventMap = {
  [K: string]: {
    schema: z.ZodType<any>;
    data: z.infer<z.ZodType<any>>;
  };
};

// Define the structure of events in the workflow
export type WorkflowDefinition<T extends WorkflowEventMap> = {
  events: {
    [K in keyof T]: {
      config: Config & { schema: T[K]['schema'] };
      schema: T[K]['schema'];
      services: string[];
      payloadFn: PayloadFunction<z.infer<T[K]['schema']>>;
      nextEvent?: keyof T;
    };
  };
};

export interface EventConfig<T> {
  config: Config & { schema?: z.ZodType<T> }; // Include schema here
  payloadFn: PayloadFunction<T>;
  services: Services;
  nextEvent?: string;
}
