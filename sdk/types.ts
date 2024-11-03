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

// Make schema optional in WorkflowEventMap
export type WorkflowEventMap = {
  [K: string]: {
    schema?: z.ZodType<any>;
    data: any;
  };
};

// Update WorkflowDefinition to handle optional schema
export type WorkflowDefinition<T extends WorkflowEventMap> = {
  events: {
    [K in keyof T]: {
      config: Config & { schema?: T[K]['schema'] };
      schema?: T[K]['schema'];
      services: string[];
      payloadFn: PayloadFunction<T[K]['data']>;
      nextEvent?: string;
      onNextEvent?: (data: T[K]['data']) => void | Promise<void>;
    };
  };
};

export interface EventConfig<T> {
  config: Config & { schema?: z.ZodType<T> };
  payloadFn: PayloadFunction<T>;
  services: Services;
  nextEvent?: string;
}
