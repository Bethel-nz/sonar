import testSignupWorkflow from './user-signup';
import testOrderWorkflow from './order-processing';
import testErrorWorkflow from './error-monitoring';
import testUploadWorkflow from './file-upload';

async function runAllTests() {
  console.log('🚀 Starting workflow tests...\n');
  
  await testSignupWorkflow();
  console.log('\n-------------------\n');
  
  await testOrderWorkflow();
  console.log('\n-------------------\n');
  
  await testErrorWorkflow();
  console.log('\n-------------------\n');
  
  await testUploadWorkflow();
  
  console.log('\n✨ All tests completed');
}

runAllTests().catch(console.error); 