import { workflow } from '@sonar/sdk';
import { z } from 'zod';
import { config } from 'dotenv';

config();

// Define your workflow's event map
type MyWorkflowEvents = {
  start: {
    schema: z.ZodObject<{
      userId: z.ZodString;
    }>;
    data: { userId: string };
  };
  process: {
    schema: z.ZodObject<{
      data: z.ZodString;
    }>;
    data: { data: string };
  };
  end: {
    schema: z.ZodObject<{
      success: z.ZodBoolean;
    }>;
    data: { success: boolean };
  };
};

// adding a generic makes each event names types plus you get full typesafety
const myWorkflow = workflow('MyWorkflow', (wf) => {
  wf.on(
    'start',
    {
      description: 'Workflow started',
      severity: 'info',
      tags: ['start'],
      schema: z.object({ userId: z.string() }),
	  },
	//userId is typed cause we specified it in the schema
    (data) => ({ startedBy: data.userId }),
    { service: ['Telegram'] }
  ).next('process', (data: { data: string }) => {
    console.log(`Processing data: ${data.data}`);
  });

  wf.on(
	  'process',
    {
      description: 'Processing data',
      severity: 'info',
		tags: ['process'],
		schema: z.object({ data: z.string() }),
	  },
    (data : { data: string }) => ({ processedData: data.data }),
    { service: ['Discord'] }
  );

  wf.on(
    'end',
    {
      description: 'Workflow ended',
      severity: 'info',
      tags: ['end'],
      schema: z.object({ success: z.boolean() }),
    },
    (data: { success: boolean }) => ({
      result: data.success ? 'Success' : 'Failure',
    }),
    { service: ['Telegram', 'Discord'] }
  );
});

// Usage:

// Test the emission
async function test() {
  try {
    console.log('Starting workflow test...');
    
    await myWorkflow.emit({ event: "start", data: { userId: "123" } });
    console.log('Start event emitted');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await myWorkflow.emit({ event: 'process', data: { data: 'some data' } });
    console.log('Process event emitted');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await myWorkflow.emit({ event: 'end', data: { success: true } });
    console.log('End event emitted');
    
    console.log('All events emitted successfully');
  } catch (error) {
    console.error('Error in workflow test:', error);
  }
}

test().catch(console.error);
