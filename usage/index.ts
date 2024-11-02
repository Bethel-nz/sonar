import { workflow } from '@sonar/sdk';
import { z } from 'zod';

type ProcessingWorkflowEvents = {
  uploadStart: {
    schema: z.ZodObject<{
      fileId: z.ZodString;
      size: z.ZodNumber;
    }>;
    data: { fileId: string; size: number };
  };
  processing: {
    schema: z.ZodObject<{
      fileId: z.ZodString;
      progress: z.ZodNumber;
    }>;
    data: { fileId: string; progress: number };
  };
  complete: {
    schema: z.ZodObject<{
      fileId: z.ZodString;
      url: z.ZodString;
    }>;
    data: { fileId: string; url: string };
  };
};

// Simulate a heavy process
async function heavyProcessing(fileId: string): Promise<void> {
  console.log(`🔄 Starting heavy processing for file: ${fileId}`);
  
  // Simulate steps in the process
  for (let i = 1; i <= 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    console.log(`⚙️ Processing step ${i}/3 for file: ${fileId}`);
  }
  
  console.log(`✅ Completed heavy processing for file: ${fileId}`);
}

const processingWorkflow = workflow<ProcessingWorkflowEvents>('FileProcessing', (wf) => {
  wf.on(
    'uploadStart',
    {
      description: 'File upload started',
      severity: 'info',
      tags: ['upload'],
      schema: z.object({ 
        fileId: z.string(),
        size: z.number()
      }),
    },
    (data) => ({ 
      id: data.fileId,
      fileSize: `${(data.size / 1024 / 1024).toFixed(2)} MB`
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('processing', async (data) => {

    console.log('🚀 Starting post-upload processing...');
    await heavyProcessing(data.fileId);
  });

  wf.on(
    'processing',
    {
      description: 'File processing',
      severity: 'info',
      tags: ['processing'],
      schema: z.object({
        fileId: z.string(),
        progress: z.number()
      }),
    },
    (data) => ({
      id: data.fileId,
      progress: `${data.progress}%`
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('complete');

  wf.on(
    'complete',
    {
      description: 'File processing completed',
      severity: 'info',
      tags: ['complete'],
      schema: z.object({
        fileId: z.string(),
        url: z.string()
      }),
    },
    (data) => ({
      id: data.fileId,
      downloadUrl: data.url
    }),
    { service: ['Discord', 'Telegram'] }
  );
});

// Test the workflow
async function testProcessingWorkflow() {
  try {
    console.log('🎬 Starting processing workflow test...');
    
    // Start upload
    const fileId = 'file_' + Date.now();
    await processingWorkflow.emit({
      event: "uploadStart",
      data: {
        fileId,
        size: 15_000_000 // 15MB
      }
    });
    
    // Simulate processing progress
    await new Promise(resolve => setTimeout(resolve, 3000));
    await processingWorkflow.emit({
      event: "processing",
      data: {
        fileId,
        progress: 50
      }
    });
    
    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 3000));
    await processingWorkflow.emit({
      event: 'complete',
      data: {
        fileId,
        url: `https://storage.example.com/files/${fileId}`
      }
    });
    
    console.log('✨ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('🏃 Running workflow test...');
testProcessingWorkflow().catch(console.error);