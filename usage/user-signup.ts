import { workflow } from '@sonar/sdk';
import { z } from 'zod';

type UserSignupEvents = {
  started: {
    data: { email: string; username: string };
  };
  verified: {
    data: { email: string; code: string };
  };
  completed: {
    data: { userId: string; email: string };
  };
  failed: {
    data: { email: string; reason: string };
  };
};

 const signupWorkflow = workflow<UserSignupEvents>('UserSignup', (wf) => {
  wf.on(
    'started',
    {
      description: 'User signup initiated',
      severity: 'info',
      tags: ['auth', 'signup'],
      schema: z.object({ 
        email: z.string().email(),
        username: z.string() 
      })
    },
    (data) => ({
      user: data.username,
      email: data.email
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('verified');

  wf.on(
    'verified',
    {
      description: 'Email verification completed',
      severity: 'info',
      tags: ['auth', 'verification'],
      schema: z.object({
        email: z.string().email(),
        code: z.string()
      })
    },
    (data) => ({
      email: data.email,
      verificationCode: data.code
    }),
    { service: ['Discord'] }
  ).next('completed');

  wf.on(
    'completed',
    {
      description: 'User registration completed',
      severity: 'info',
      tags: ['auth', 'signup'],
      schema: z.object({
        userId: z.string(),
        email: z.string().email()
      })
    },
    (data) => ({
      userId: data.userId,
      email: data.email
    }),
    { service: ['Discord', 'Telegram'] }
  );
}); 

export default async function testSignupWorkflow() {
  try {
    console.log('🧪 Testing User Signup Workflow...');

    // Emit signup start
    await signupWorkflow.emit({
      event: 'started',
      data: {
        email: 'user@example.com',
        username: 'newUser123'
      }
    });

    // Simulate verification
    await signupWorkflow.emit({
      event: 'verified',
      data: {
        email: 'user@example.com',
        code: 'ABC123'
      }
    });

    // Emit completion
    await signupWorkflow.emit({
      event: 'completed',
      data: {
        userId: 'usr_' + Date.now(),
        email: 'user@example.com'
      }
    });

    console.log('✅ User Signup Workflow test completed');
  } catch (error) {
    console.error('❌ User Signup Workflow test failed:', error);
  }
} 


