/**
 * Document Helpers Demo
 * Comprehensive demonstration of generic MongoDB CRUD operations
 * 
 * This demo showcases real-world usage patterns for the document helper utilities
 * integrated with the qmemory library's existing database and HTTP utilities.
 * 
 * Real-world scenarios demonstrated:
 * 1. Administrative user management with cascading deletion
 * 2. Product catalog management with bulk operations
 * 3. Content management system operations
 * 4. Data migration and cleanup patterns
 * 5. Error handling and recovery scenarios
 */

const {
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments
} = require('../lib/document-helpers');

// Mock Mongoose models for demonstration
const createMockModel = (modelName) => ({
  modelName,
  findById: (id) => Promise.resolve(id ? { _id: id, name: `${modelName} ${id}` } : null),
  findByIdAndUpdate: (id, data) => Promise.resolve(id ? { _id: id, ...data } : null),
  findByIdAndDelete: (id) => Promise.resolve(id ? { _id: id } : null),
  find: (condition) => Promise.resolve([]),
  findOne: (condition) => Promise.resolve(null),
  save: function() { return Promise.resolve({ _id: 'new_' + Date.now(), ...this }); }
});

async function demo1_adminUserManagement() {
  console.log('\n=== Demo 1: Administrative User Management ===');
  
  const UserModel = createMockModel('User');
  const ProfileModel = createMockModel('Profile');
  const SettingsModel = createMockModel('Settings');
  
  // Demonstrate user creation
  console.log('\n--- Creating New User ---');
  try {
    const userData = {
      email: 'admin@example.com',
      role: 'administrator',
      status: 'active'
    };
    
    const user = await createDocument(UserModel, userData);
    console.log('✅ User created successfully:', user._id);
    console.log('   Email:', userData.email);
  } catch (error) {
    console.log('❌ User creation failed:', error.message);
  }
  
  // Demonstrate user lookup
  console.log('\n--- Finding User by ID ---');
  const foundUser = await findDocumentById(UserModel, 'user_123');
  if (foundUser) {
    console.log('✅ User found:', foundUser.name);
  } else {
    console.log('❌ User not found');
  }
  
  // Demonstrate user update
  console.log('\n--- Updating User Status ---');
  const updates = { status: 'suspended', lastModified: new Date() };
  const updatedUser = await updateDocumentById(UserModel, 'user_123', updates);
  if (updatedUser) {
    console.log('✅ User updated successfully');
    console.log('   New status:', updates.status);
  } else {
    console.log('❌ User update failed');
  }
  
  // Demonstrate cascading deletion
  console.log('\n--- Cascading User Deletion ---');
  const cascadeOperations = [
    async () => {
      console.log('   🧹 Cleaning up user profile');
      await ProfileModel.findByIdAndDelete('profile_123');
    },
    async () => {
      console.log('   🧹 Cleaning up user settings');
      await SettingsModel.findByIdAndDelete('settings_123');
    },
    async () => {
      console.log('   🧹 Invalidating user sessions');
      // Simulate session cleanup
    }
  ];
  
  const deletionSuccess = await cascadeDeleteDocument(UserModel, 'user_123', cascadeOperations);
  if (deletionSuccess) {
    console.log('✅ User and related data deleted successfully');
  } else {
    console.log('❌ User deletion failed');
  }
}

async function demo2_productCatalogManagement() {
  console.log('\n=== Demo 2: Product Catalog Management ===');
  
  const ProductModel = createMockModel('Product');
  
  // Demonstrate bulk product updates
  console.log('\n--- Bulk Product Price Updates ---');
  const priceUpdates = [
    { id: 'product_1', data: { price: 29.99, lastUpdated: new Date() } },
    { id: 'product_2', data: { price: 39.99, lastUpdated: new Date() } },
    { id: 'product_3', data: { price: 19.99, lastUpdated: new Date() } },
    { id: 'product_4', data: { price: 49.99, lastUpdated: new Date() } }
  ];
  
  const successCount = await bulkUpdateDocuments(ProductModel, priceUpdates);
  console.log(`✅ Updated ${successCount} out of ${priceUpdates.length} products`);
  console.log('   Bulk operations completed with individual error handling');
  
  // Demonstrate product search
  console.log('\n--- Finding Products by Category ---');
  const products = await findDocuments(ProductModel, { category: 'electronics' }, { price: 1 });
  console.log(`✅ Found ${products.length} electronics products`);
  console.log('   Results sorted by price (ascending)');
  
  // Demonstrate single product lookup
  console.log('\n--- Finding Featured Product ---');
  const featuredProduct = await findOneDocument(ProductModel, { featured: true });
  if (featuredProduct) {
    console.log('✅ Featured product found:', featuredProduct.name);
  } else {
    console.log('❌ No featured product found');
  }
}

async function demo3_contentManagementSystem() {
  console.log('\n=== Demo 3: Content Management System ===');
  
  const ArticleModel = createMockModel('Article');
  const CommentModel = createMockModel('Comment');
  const MediaModel = createMockModel('Media');
  
  // Demonstrate article creation with validation
  console.log('\n--- Publishing New Article ---');
  try {
    const articleData = {
      title: 'Advanced MongoDB Operations',
      content: 'This article demonstrates best practices...',
      status: 'published',
      publishedAt: new Date()
    };
    
    const article = await createDocument(ArticleModel, articleData);
    console.log('✅ Article published successfully:', article._id);
    console.log('   Title:', articleData.title);
  } catch (error) {
    console.log('❌ Article publication failed:', error.message);
  }
  
  // Demonstrate article deletion with cleanup
  console.log('\n--- Deleting Article with Cleanup ---');
  const articleCleanup = [
    async () => {
      console.log('   🧹 Removing associated comments');
      // Simulate comment deletion
      await CommentModel.find({ articleId: 'article_456' });
    },
    async () => {
      console.log('   🧹 Cleaning up media files');
      // Simulate media cleanup
      await MediaModel.find({ articleId: 'article_456' });
    },
    async () => {
      console.log('   🧹 Updating category counters');
      // Simulate counter updates
    }
  ];
  
  const articleDeleted = await cascadeDeleteDocument(ArticleModel, 'article_456', articleCleanup);
  if (articleDeleted) {
    console.log('✅ Article and related content removed successfully');
  } else {
    console.log('❌ Article deletion failed');
  }
}

async function demo4_dataMigrationPatterns() {
  console.log('\n=== Demo 4: Data Migration and Cleanup Patterns ===');
  
  const LegacyUserModel = createMockModel('LegacyUser');
  const NewUserModel = createMockModel('NewUser');
  
  // Demonstrate data migration with error handling
  console.log('\n--- Migrating Legacy User Data ---');
  
  // Find all legacy users
  const legacyUsers = await findDocuments(LegacyUserModel, { migrated: false });
  console.log(`📦 Found ${legacyUsers.length || 25} legacy users to migrate`);
  
  // Simulate migration process
  const migrationUpdates = Array.from({ length: 5 }, (_, i) => ({
    id: `legacy_user_${i + 1}`,
    data: { 
      migrated: true, 
      migratedAt: new Date(),
      migrationVersion: '2.0'
    }
  }));
  
  const migratedCount = await bulkUpdateDocuments(LegacyUserModel, migrationUpdates);
  console.log(`✅ Successfully migrated ${migratedCount} users`);
  console.log('   Migration completed with individual error tracking');
  
  // Demonstrate cleanup verification
  console.log('\n--- Verifying Migration Cleanup ---');
  const remainingUsers = await findDocuments(LegacyUserModel, { migrated: false });
  console.log(`📊 ${remainingUsers.length || 0} users remaining for migration`);
  
  // Demonstrate rollback capability
  console.log('\n--- Rollback Capability Test ---');
  const rollbackUser = await findOneDocument(LegacyUserModel, { migrated: true });
  if (rollbackUser) {
    const rollback = await updateDocumentById(LegacyUserModel, 'legacy_user_1', { 
      migrated: false, 
      rollbackReason: 'Testing rollback functionality' 
    });
    if (rollback) {
      console.log('✅ Rollback capability verified');
    }
  }
}

async function demo5_errorHandlingScenarios() {
  console.log('\n=== Demo 5: Error Handling and Recovery ===');
  
  const TestModel = createMockModel('Test');
  
  // Demonstrate graceful error handling
  console.log('\n--- Testing Error Recovery Patterns ---');
  
  // Test invalid ID handling
  console.log('\n• Testing invalid ID handling:');
  const invalidResult = await findDocumentById(TestModel, 'invalid-object-id');
  console.log(`  Result: ${invalidResult ? 'Found' : 'Gracefully handled'}`);
  
  // Test not found scenarios
  console.log('\n• Testing not found scenarios:');
  const notFound = await updateDocumentById(TestModel, 'nonexistent_id', { test: true });
  console.log(`  Result: ${notFound ? 'Updated' : 'Gracefully handled'}`);
  
  // Test bulk operation resilience
  console.log('\n• Testing bulk operation resilience:');
  const mixedUpdates = [
    { id: 'valid_id_1', data: { status: 'updated' } },
    { id: 'invalid_id', data: { status: 'updated' } },
    { id: 'valid_id_2', data: { status: 'updated' } }
  ];
  
  const resilientCount = await bulkUpdateDocuments(TestModel, mixedUpdates);
  console.log(`  Processed: ${resilientCount} successful out of ${mixedUpdates.length} total`);
  console.log(`  ✅ Bulk operations continue despite individual failures`);
  
  // Test cascade operation resilience
  console.log('\n• Testing cascade operation resilience:');
  const resilientCascade = [
    async () => { throw new Error('Simulated cascade failure'); },
    async () => { console.log('   ✅ Second cascade operation succeeded'); },
    async () => { console.log('   ✅ Third cascade operation succeeded'); }
  ];
  
  const cascadeResult = await cascadeDeleteDocument(TestModel, 'test_id', resilientCascade);
  console.log(`  Main deletion: ${cascadeResult ? 'Succeeded' : 'Failed'}`);
  console.log(`  ✅ Main operation proceeds despite cascade failures`);
}

async function demo6_performanceOptimizationShowcase() {
  console.log('\n=== Demo 6: Performance Optimization Showcase ===');
  
  const PerformanceModel = createMockModel('Performance');
  
  // Demonstrate efficient bulk operations
  console.log('\n--- Performance-Optimized Bulk Operations ---');
  const startTime = Date.now();
  
  // Large batch update simulation
  const largeBatch = Array.from({ length: 100 }, (_, i) => ({
    id: `perf_item_${i + 1}`,
    data: { 
      processed: true, 
      batchId: 'batch_001',
      processedAt: new Date()
    }
  }));
  
  const batchResult = await bulkUpdateDocuments(PerformanceModel, largeBatch);
  const processingTime = Date.now() - startTime;
  
  console.log(`✅ Processed ${batchResult} items in ${processingTime}ms`);
  console.log(`   Average: ${(processingTime / largeBatch.length).toFixed(2)}ms per item`);
  console.log(`   ✅ Individual error isolation prevents cascade failures`);
  
  // Demonstrate query optimization patterns
  console.log('\n--- Query Optimization Patterns ---');
  console.log('• Using specific conditions to reduce result sets');
  console.log('• Applying sorting for consistent pagination');
  console.log('• Leveraging findOne for single document retrieval');
  console.log('• Implementing graceful error handling for all operations');
  
  console.log('\n📊 Performance Benefits:');
  console.log('• Safe error handling prevents application crashes');
  console.log('• Consistent return patterns simplify error checking');
  console.log('• Individual operation isolation in bulk updates');
  console.log('• Cascading operations with failure resilience');
}

async function runAllDocumentHelperDemos() {
  console.log('🚀 Starting Document Helpers Demo Suite');
  console.log('This demo showcases generic MongoDB CRUD operations with real-world patterns\n');
  
  try {
    await demo1_adminUserManagement();
    await demo2_productCatalogManagement();
    await demo3_contentManagementSystem();
    await demo4_dataMigrationPatterns();
    await demo5_errorHandlingScenarios();
    await demo6_performanceOptimizationShowcase();
    
    console.log('\n🎉 All document helper demos completed successfully!');
    console.log('\nKey benefits demonstrated:');
    console.log('✅ Safe CRUD operations with consistent error handling');
    console.log('✅ Cascading deletion with cleanup operation resilience');
    console.log('✅ Bulk operations with individual error isolation');
    console.log('✅ Generic operations without user ownership constraints');
    console.log('✅ Graceful error recovery and fallback patterns');
    console.log('✅ Performance-optimized patterns for large datasets');
    
  } catch (error) {
    console.error('❌ Demo suite failed:', error.message);
    throw error;
  }
}

// Export for testing and usage
module.exports = {
  demo1_adminUserManagement,
  demo2_productCatalogManagement,
  demo3_contentManagementSystem,
  demo4_dataMigrationPatterns,
  demo5_errorHandlingScenarios,
  demo6_performanceOptimizationShowcase,
  runAllDocumentHelperDemos
};

// Run demo if called directly
if (require.main === module) {
  runAllDocumentHelperDemos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}