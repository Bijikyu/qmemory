const { findDocumentById } = require('./lib/document-helpers');
const { logger } = require('./lib/logging-utils');

console.log('Testing logger methods:');
console.log('logger object:', typeof logger);
console.log('logger has logDebug:', 'logDebug' in logger);
console.log('logger methods:', Object.keys(logger));
console.log('logger.logDebug type:', typeof logger.logDebug);

findDocumentById('507f1f77bf51e89f40f1234abcd')
  .then(r => {
    console.log('SUCCESS: Found document');
    console.log('Document ID:', r._id);
    console.log('Document title:', r.title);
  })
  .catch(e => {
    console.log('ERROR:', e.message);
  });