/**
 * Database Operations Demo
 * Comprehensive demonstration of enhanced database utilities
 * 
 * This demo showcases real-world usage patterns for the enhanced database utilities
 * integrated with the qmemory library's existing storage and HTTP utilities.
 * 
 * Real-world scenarios demonstrated:
 * 1. Payment processing with idempotency and retry logic
 * 2. User registration with duplicate handling and validation
 * 3. Data analytics with optimized queries and aggregation
 * 4. Error recovery patterns for production resilience
 * 5. Performance monitoring and optimization insights
 */

const {
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline
} = require('../lib/database-utils');

// Mock Mongoose models for demonstration
const createMockModel = (modelName) => ({
  modelName,
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  aggregate: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  hint: jest.fn().mockReturnThis()
});

async function demo1_paymentProcessingWithIdempotency() {
  console.log('\n=== Demo 1: Payment Processing with Idempotency ===');
  
  const PaymentModel = createMockModel('Payment');
  
  // Simulate payment processing with idempotency key
  const processPayment = async (paymentData, idempotencyKey) => {
    console.log(`Processing payment for ${paymentData.amount} with key: ${idempotencyKey}`);
    
    const result = await ensureIdempotency(
      PaymentModel,
      { field: 'idempotencyKey', value: idempotencyKey },
      async () => {
        // Simulate payment processing
        return {
          _id: 'payment_' + Date.now(),
          ...paymentData,
          idempotencyKey,
          status: 'completed',
          processedAt: new Date()
        };
      },
      'processPayment'
    );
    
    if (result.success) {
      if (result.idempotent) {
        console.log('✅ Payment already processed (idempotent):', result.data._id);
      } else {
        console.log('✅ Payment processed successfully:', result.data._id);
      }
    } else {
      console.log('❌ Payment processing failed:', result.error.message);
    }
    
    return result;
  };
  
  // Mock existing payment for idempotency test
  PaymentModel.findOne.mockResolvedValueOnce({
    _id: 'existing_payment_123',
    amount: 100,
    idempotencyKey: 'payment_duplicate_test',
    status: 'completed'
  });
  
  // Test idempotent payment processing
  await processPayment(
    { amount: 100, currency: 'USD', customerId: 'cust_123' },
    'payment_duplicate_test'
  );
  
  // Test new payment processing
  PaymentModel.findOne.mockResolvedValueOnce(null);
  await processPayment(
    { amount: 50, currency: 'USD', customerId: 'cust_456' },
    'payment_new_123'
  );
}

async function demo2_userRegistrationWithRetryLogic() {
  console.log('\n=== Demo 2: User Registration with Retry Logic ===');
  
  const UserModel = createMockModel('User');
  
  // Simulate user registration with retry logic for network issues
  const registerUser = async (userData) => {
    console.log(`Registering user: ${userData.email}`);
    
    const result = await retryDbOperation(
      async () => {
        // Simulate database operation
        return await safeDbOperation(
          async () => {
            // Check for existing user
            const existing = await UserModel.findOne({ email: userData.email });
            if (existing) {
              const error = new Error('User already exists');
              error.code = 11000;
              error.keyValue = { email: userData.email };
              throw error;
            }
            
            // Create new user
            return await UserModel.create({
              ...userData,
              _id: 'user_' + Date.now(),
              createdAt: new Date()
            });
          },
          'createUser',
          { email: userData.email }
        );
      },
      'registerUser',
      {
        maxRetries: 3,
        baseDelay: 1000,
        retryCondition: (error) => error.type === 'TIMEOUT_ERROR' || error.type === 'CONNECTION_ERROR'
      }
    );
    
    if (result.success) {
      console.log('✅ User registered successfully:', result.data._id);
    } else {
      console.log('❌ User registration failed:', result.error.message);
    }
    
    return result;
  };
  
  // Mock successful registration
  UserModel.findOne.mockResolvedValueOnce(null);
  UserModel.create.mockResolvedValueOnce({
    _id: 'user_789',
    email: 'newuser@example.com',
    name: 'New User',
    createdAt: new Date()
  });
  
  await registerUser({
    email: 'newuser@example.com',
    name: 'New User',
    password: 'hashedpassword123'
  });
}

async function demo3_dataAnalyticsWithOptimization() {
  console.log('\n=== Demo 3: Data Analytics with Query Optimization ===');
  
  const OrderModel = createMockModel('Order');
  
  // Demonstrate optimized queries for analytics
  const getTopCustomers = async (limit = 10) => {
    console.log(`Fetching top ${limit} customers with optimized queries`);
    
    // Create base query
    const baseQuery = OrderModel.find({ status: 'completed' });
    
    // Apply optimizations
    const optimizedQuery = optimizeQuery(baseQuery, {
      lean: true, // Return plain JS objects for better performance
      select: 'customerId totalAmount createdAt', // Only fetch needed fields
      sort: { totalAmount: -1 }, // Sort by amount descending
      limit: limit,
      hint: { status: 1, totalAmount: -1 } // Use index hint
    });
    
    console.log('✅ Query optimized with lean, select, sort, limit, and index hints');
    
    // Mock query execution
    const mockResults = Array.from({ length: limit }, (_, i) => ({
      customerId: `customer_${i + 1}`,
      totalAmount: 1000 - (i * 50),
      createdAt: new Date(Date.now() - i * 86400000) // Different days
    }));
    
    console.log('📊 Top customers by order value:', mockResults.slice(0, 3));
    return mockResults;
  };
  
  // Demonstrate aggregation pipeline for advanced analytics
  const getMonthlyRevenue = async () => {
    console.log('Building aggregation pipeline for monthly revenue analysis');
    
    const pipeline = createAggregationPipeline([
      {
        match: { 
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        }
      },
      {
        group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        limit: 12
      },
      {
        project: {
          month: '$_id.month',
          year: '$_id.year',
          revenue: '$totalRevenue',
          orders: '$orderCount',
          averageOrderValue: { $divide: ['$totalRevenue', '$orderCount'] }
        }
      }
    ]);
    
    console.log('✅ Aggregation pipeline created with match, group, sort, limit, and project stages');
    console.log('📈 Pipeline includes revenue calculation and average order value');
    
    // Mock aggregation results
    const mockResults = [
      { month: 12, year: 2024, revenue: 25000, orders: 150, averageOrderValue: 166.67 },
      { month: 11, year: 2024, revenue: 22000, orders: 140, averageOrderValue: 157.14 },
      { month: 10, year: 2024, revenue: 28000, orders: 165, averageOrderValue: 169.70 }
    ];
    
    console.log('📊 Monthly revenue summary:', mockResults);
    return mockResults;
  };
  
  await getTopCustomers(5);
  await getMonthlyRevenue();
}

async function demo4_errorRecoveryPatterns() {
  console.log('\n=== Demo 4: Error Recovery Patterns ===');
  
  // Demonstrate comprehensive error handling
  const handleDatabaseErrors = async () => {
    console.log('Testing different MongoDB error scenarios');
    
    const testCases = [
      {
        name: 'Duplicate Key Error',
        error: {
          code: 11000,
          message: 'E11000 duplicate key error',
          keyValue: { email: 'duplicate@example.com' }
        }
      },
      {
        name: 'Validation Error',
        error: {
          name: 'ValidationError',
          message: 'Validation failed',
          errors: {
            email: { message: 'Email is required' },
            password: { message: 'Password too short' }
          }
        }
      },
      {
        name: 'Connection Error',
        error: {
          name: 'MongoNetworkError',
          message: 'Connection failed'
        }
      },
      {
        name: 'Timeout Error',
        error: {
          name: 'MongoServerSelectionError',
          message: 'Server selection timeout'
        }
      }
    ];
    
    testCases.forEach(testCase => {
      console.log(`\nTesting: ${testCase.name}`);
      const result = handleMongoError(testCase.error, 'testOperation', { testCase: testCase.name });
      
      console.log(`  ✅ Error type: ${result.type}`);
      console.log(`  ✅ Recoverable: ${result.recoverable}`);
      console.log(`  ✅ Status code: ${result.statusCode}`);
      console.log(`  ✅ Message: ${result.message}`);
    });
  };
  
  await handleDatabaseErrors();
}

async function demo5_performanceMonitoringIntegration() {
  console.log('\n=== Demo 5: Performance Monitoring Integration ===');
  
  // Demonstrate performance tracking with database operations
  const performanceTrackingExample = async () => {
    console.log('Demonstrating performance tracking with database operations');
    
    const operations = [
      { name: 'fastQuery', delay: 50 },
      { name: 'mediumQuery', delay: 200 },
      { name: 'slowQuery', delay: 1000 }
    ];
    
    for (const op of operations) {
      console.log(`\nExecuting ${op.name} (simulated ${op.delay}ms)`);
      
      const result = await safeDbOperation(
        async () => {
          // Simulate operation delay
          await new Promise(resolve => setTimeout(resolve, op.delay));
          return { operation: op.name, result: 'success' };
        },
        op.name,
        { operation: op.name, expectedDelay: op.delay }
      );
      
      if (result.success) {
        const performance = result.processingTime > 500 ? '🐌 SLOW' : 
                           result.processingTime > 100 ? '⚠️ MEDIUM' : '⚡ FAST';
        
        console.log(`  ✅ Operation completed: ${result.processingTime}ms ${performance}`);
      }
    }
    
    console.log('\n📊 Performance monitoring provides timing data for optimization');
  };
  
  await performanceTrackingExample();
}

async function demo6_realWorldIntegrationExample() {
  console.log('\n=== Demo 6: Real-World Integration Example ===');
  
  // Comprehensive example combining multiple utilities
  const processOrderWithFullErrorHandling = async (orderData, idempotencyKey) => {
    console.log(`Processing order with comprehensive error handling`);
    console.log(`Order: ${JSON.stringify(orderData)}`);
    console.log(`Idempotency key: ${idempotencyKey}`);
    
    const OrderModel = createMockModel('Order');
    const CustomerModel = createMockModel('Customer');
    
    // Step 1: Ensure idempotency
    const result = await ensureIdempotency(
      OrderModel,
      { field: 'idempotencyKey', value: idempotencyKey },
      async () => {
        // Step 2: Use retry logic for customer lookup
        const customerResult = await retryDbOperation(
          async () => {
            const query = CustomerModel.findOne({ _id: orderData.customerId });
            const optimizedQuery = optimizeQuery(query, {
              lean: true,
              select: 'name email status creditLimit'
            });
            
            // Mock customer data
            return { 
              _id: orderData.customerId, 
              name: 'John Doe', 
              email: 'john@example.com',
              status: 'active',
              creditLimit: 5000
            };
          },
          'findCustomer',
          { maxRetries: 2, context: { customerId: orderData.customerId } }
        );
        
        if (!customerResult.success) {
          throw new Error('Customer lookup failed');
        }
        
        // Step 3: Create order with safe operation wrapper
        return await safeDbOperation(
          async () => {
            return {
              _id: 'order_' + Date.now(),
              ...orderData,
              idempotencyKey,
              customer: customerResult.data,
              status: 'confirmed',
              createdAt: new Date()
            };
          },
          'createOrder',
          { customerId: orderData.customerId, amount: orderData.amount }
        );
      },
      'processOrder'
    );
    
    if (result.success) {
      console.log('✅ Order processed successfully');
      console.log(`   Order ID: ${result.data._id || result.data.data._id}`);
      if (result.idempotent) {
        console.log('   🔄 Idempotent operation detected');
      }
    } else {
      console.log('❌ Order processing failed:', result.error.message);
    }
    
    return result;
  };
  
  // Mock successful processing
  const OrderModel = createMockModel('Order');
  OrderModel.findOne.mockResolvedValueOnce(null); // No existing order
  
  await processOrderWithFullErrorHandling(
    {
      customerId: 'customer_123',
      items: [
        { productId: 'prod_1', quantity: 2, price: 29.99 },
        { productId: 'prod_2', quantity: 1, price: 15.50 }
      ],
      amount: 75.48,
      currency: 'USD'
    },
    'order_idempotency_key_123'
  );
}

async function runAllDatabaseOperationDemos() {
  console.log('🚀 Starting Database Operations Demo Suite');
  console.log('This demo showcases enhanced database utilities with real-world patterns\n');
  
  try {
    await demo1_paymentProcessingWithIdempotency();
    await demo2_userRegistrationWithRetryLogic();
    await demo3_dataAnalyticsWithOptimization();
    await demo4_errorRecoveryPatterns();
    await demo5_performanceMonitoringIntegration();
    await demo6_realWorldIntegrationExample();
    
    console.log('\n🎉 All database operation demos completed successfully!');
    console.log('\nKey benefits demonstrated:');
    console.log('✅ Idempotency prevents duplicate processing');
    console.log('✅ Retry logic handles transient failures');
    console.log('✅ Query optimization improves performance');
    console.log('✅ Error handling provides structured responses');
    console.log('✅ Performance monitoring enables optimization');
    console.log('✅ Safe operations prevent data corruption');
    
  } catch (error) {
    console.error('❌ Demo suite failed:', error.message);
    throw error;
  }
}

// Export for testing and usage
module.exports = {
  demo1_paymentProcessingWithIdempotency,
  demo2_userRegistrationWithRetryLogic,
  demo3_dataAnalyticsWithOptimization,
  demo4_errorRecoveryPatterns,
  demo5_performanceMonitoringIntegration,
  demo6_realWorldIntegrationExample,
  runAllDatabaseOperationDemos
};

// Run demo if called directly
if (require.main === module) {
  runAllDatabaseOperationDemos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}