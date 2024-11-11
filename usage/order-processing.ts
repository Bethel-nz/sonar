import { workflow } from '@sonar/sdk';
import { z } from 'zod';

type OrderEvents = {
  created: {
    data: { orderId: string; amount: number; items: string[] };
  };
  paymentProcessed: {
    data: { orderId: string; transactionId: string };
  };
  shipped: {
    data: { orderId: string; trackingNumber: string };
  };
  delivered: {
    data: { orderId: string; deliveryDate: Date };
  };
};

export const orderWorkflow = workflow<OrderEvents>('OrderProcessing', (wf) => {
  wf.on(
    'created',
    {
      description: 'New order created',
      severity: 'info',
      tags: ['order', 'payment'],
      schema: z.object({
        orderId: z.string(),
        amount: z.number(),
        items: z.array(z.string())
      })
    },
    (data) => ({
      order: data.orderId,
      total: `$${data.amount.toFixed(2)}`,
      itemCount: data.items.length
    }),
    { service: ['Discord'] }
  ).next('paymentProcessed');

  wf.on(
    'paymentProcessed',
    {
      description: 'Payment processed successfully',
      severity: 'info',
      tags: ['order', 'payment'],
      schema: z.object({
        orderId: z.string(),
        transactionId: z.string()
      })
    },
    (data) => ({
      order: data.orderId,
      transaction: data.transactionId
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('shipped');

  wf.on("shipped", {
    description: 'Order shipped',
    severity: 'info',
    tags: ['order', 'shipping'],
    schema: z.object({
      orderId: z.string(),
      trackingNumber: z.string()
    })
  }, (data) => ({
    order: data.orderId,
    tracking: data.trackingNumber
    }),
    { service: ['Discord', 'Telegram'] }
  );

  wf.on('delivered', {
    description: 'Order delivered',
    severity: 'info',
      tags: ['order', 'delivery'],
    },
    (data) => ({
      order: data.orderId,
      deliveryDate: data.deliveryDate
    }),
    { service: ['Discord', 'Telegram'] }
  );  
});   


export default async function testOrderWorkflow() {
  try {
    console.log('🧪 Testing Order Processing Workflow...');
    
    const orderId = 'ord_' + Date.now();

    // Create order
    await orderWorkflow.emit({
      event: 'created',
      data: {
        orderId,
        amount: 99.99,
        items: ['item1', 'item2']
      }
    });

    // Process payment
    await orderWorkflow.emit({
      event: 'paymentProcessed',
      data: {
        orderId,
        transactionId: 'tx_' + Date.now()
      }
    });

    // Ship order
    await orderWorkflow.emit({
      event: 'shipped',
      data: {
        orderId,
        trackingNumber: 'TRK123456'
      }
    });

    // Mark as delivered
    await orderWorkflow.emit({
      event: 'delivered',
      data: {
        orderId,
        deliveryDate: new Date()
      }
    });

    console.log('✅ Order Processing Workflow test completed');
  } catch (error) {
    console.error('❌ Order Processing Workflow test failed:', error);
  }
} 