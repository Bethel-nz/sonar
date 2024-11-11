import { workflow } from '@sonar/sdk';
import { z } from 'zod';

type UploadEvents = {
  started: {
    data: { fileId: string; name: string; size: number };
  };
  processing: {
    data: { fileId: string; progress: number };
  };
  completed: {
    data: { fileId: string; url: string; duration: number };
  };
  failed: {
    data: { fileId: string; error: string };
  };
};

export const uploadWorkflow = workflow<UploadEvents>('FileUpload', (wf) => {
  wf.on(
    'started',
    {
      description: 'File upload started',
      severity: 'info',
      tags: ['upload'],
      schema: z.object({
        fileId: z.string(),
        name: z.string(),
        size: z.number()
      })
    },
    (data) => ({
      id: data.fileId,
      fileName: data.name,
      size: `${(data.size / 1024 / 1024).toFixed(2)} MB`
    }),
    { service: ['Discord'] }
  ).next('processing');

  wf.on(
    'processing',
    {
      description: 'File upload processing',
      severity: 'info',
      tags: ['upload', 'processing'],
      schema: z.object({
        fileId: z.string(),
        progress: z.number()
      })
    },
    (data) => ({
      id: data.fileId,
      progress: `${data.progress}%`
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('completed');

    wf.on("completed",{
      description:"File upload workflow completed",
      severity:"info",
      tags:["upload", "completed"],
      schema: z.object({
        fileId:z.string(),
        url:z.string(),
        duration:z.number()
      })
    },(data)=>({
      fileId:data.fileId,
      url:data.url,
      duration:`${data.duration} seconds`
    }),
    {service:["Discord"]}
  )
}); 


export default async function testUploadWorkflow() {
  try {
    console.log('🧪 Testing File Upload Workflow...');

    const fileId = 'file_' + Date.now();

    // Start upload
    await uploadWorkflow.emit({
      event: 'started',
      data: {
        fileId,
        name: 'large-document.pdf',
        size: 15_000_000 // 15MB
      }
    });

    // Update progress
    await uploadWorkflow.emit({
      event: 'processing',
      data: {
        fileId,
        progress: 50
      }
    });

    // Mark as complete
    await uploadWorkflow.emit({
      event: 'completed',
      data: {
        fileId,
        url: `https://storage.example.com/files/${fileId}`,
        duration: 3.5 // seconds
      }
    });

    console.log('✅ File Upload Workflow test completed');
  } catch (error) {
    console.error('❌ File Upload Workflow test failed:', error);
  }
} 


testUploadWorkflow()