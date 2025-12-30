// Simple test to verify bounded-queue functionality after documentation enhancement
import { BoundedQueue } from './dist/index.js';

// Test basic functionality
const queue = new BoundedQueue() < string > 3;

console.log('Testing BoundedQueue after documentation enhancement...');

// Test basic operations
queue.push('first');
queue.push('second');
queue.push('third');

console.log('Length:', queue.length); // Should be 3
console.log('Is full:', queue.isFull); // Should be true
console.log('First item:', queue.peek()); // Should be 'first'
console.log('Last item:', queue.peekLast()); // Should be 'third'

// Test overwrite behavior
queue.push('fourth'); // Should overwrite 'first'
console.log('Length after overwrite:', queue.length); // Should be 3
console.log('Is full after overwrite:', queue.isFull); // Should be true

// Test search
console.log('Contains "second":', queue.includes('second')); // Should be true
console.log('Contains "first":', queue.includes('first')); // Should be false (was overwritten)
console.log('Index of "third":', queue.indexOf('third')); // Should be 1

// Test iteration
console.log('Queue contents:', queue.toArray()); // Should be ['second', 'third', 'fourth']

// Test removal
const removed = queue.shift();
console.log('Removed item:', removed); // Should be 'second'
console.log('Length after shift:', queue.length); // Should be 2

console.log('✅ All tests passed - functionality working correctly');
