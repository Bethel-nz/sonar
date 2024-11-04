import { workflow } from '@sonar/sdk';
import { z } from 'zod';

type ErrorEvents = {
  detected: {
    
    data: { 
      errorId: string;
      message: string;
      stack: string;
      severity: 'low' | 'medium' | 'high';
    };
  };
  investigated: {
    data: {
      errorId: string;
      diagnosis: string;
    };
  };
  resolved: {
    data: {
      errorId: string;
      solution: string;
      timeToResolve: number;
    };
  };
};

export const errorWorkflow = workflow<ErrorEvents>('ErrorMonitoring', (wf) => {
  wf.on(
    'detected',
    {
      description: 'New error detected',
      severity: 'error',
      tags: ['error', 'monitoring'],
      schema: z.object({
        errorId: z.string(),
        message: z.string(),
        stack: z.string(),
        severity: z.enum(['low', 'medium', 'high'])
      })
    },
    (data) => ({
      id: data.errorId,
      error: data.message,
      severity: data.severity,
      stackTrace: data.stack
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('investigated');
}); 

export default async function testErrorWorkflow() {
  try {
    console.log('🧪 Testing Error Monitoring Workflow...');

    const errorId = 'err_' + Date.now();

    // Detect error
    await errorWorkflow.emit({
      event: 'detected',
      data: {
        errorId,
        message: 'Database connection failed',
        stack: 'Error: Connection timeout\n    at Database.connect (/app/db.ts:123)',
        severity: 'high'
      }
    });

    // Investigate error
    await errorWorkflow.emit({
      event: 'investigated',
      data: {
        errorId,
        diagnosis: 'Network connectivity issues between application and database'
      }
    });

    // Mark as resolved
    await errorWorkflow.emit({
      event: 'resolved',
      data: {
        errorId,
        solution: 'Updated database connection timeout settings',
        timeToResolve: 1800 // 30 minutes in seconds
      }
    });

    console.log('✅ Error Monitoring Workflow test completed');
  } catch (error) {
    console.error('❌ Error Monitoring Workflow test failed:', error);
  }
} 


testErrorWorkflow();

/*
This is not the intended usage, i just cant write a complex application using it but if you were to use it in an application, you would write it like ths:

// your workflow defininion
const myworkflow = workflow("something", {...})

inside the function ou need to track do:

try{
... process user signup for example
myworkflow.emit({event:"signup", data:{message: "new signup"}})
}catch(error){
console.log(error)
myworkflow.emit({event:"sign-up failed", data:{error: error?.message}})
}

*/