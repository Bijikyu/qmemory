import { greet, add, isEven, dedupe } from './index.js';

console.log('Testing refactored utils:');
console.log('greet("test"):', greet('test'));
console.log('add(2, 3):', add(2, 3));
console.log('isEven(4):', isEven(4));
console.log('dedupe([1,2,2,3]):', dedupe([1, 2, 2, 3]));
