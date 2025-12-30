// Simple test to understand array capacity issue
console.log('Testing array creation with different sizes:');

for (let size = 1; size <= 5; size++) {
  const capacity = Math.pow(2, Math.ceil(Math.log2(size)));
  console.log(`Size: ${size}, Capacity: ${capacity}, Can hold: ${Math.min(size, capacity)}`);
}
