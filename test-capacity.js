// Test the circular buffer capacity calculation
function testCapacity(maxSize) {
  if (maxSize <= 0) {
    console.log('Error: Max size must be greater than 0');
    return;
  }

  const capacity = Math.pow(2, Math.ceil(Math.log2(maxSize)));
  console.log(
    `Max size: ${maxSize}, log2: ${Math.log2(maxSize)}, ceil: ${Math.ceil(Math.log2(maxSize))}, capacity: ${capacity}`
  );
}

testCapacity(1);
testCapacity(2);
testCapacity(3);
testCapacity(4);
testCapacity(5);
testCapacity(8);
testCapacity(10);
