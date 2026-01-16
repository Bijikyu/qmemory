/**
 * Unit tests for helper functions in document-ops
 * Focuses on validateDocumentUniqueness and hasUniqueFieldChanges
 */

jest.mock('../../lib/database-utils'); // isolate database utils

const { validateDocumentUniqueness, hasUniqueFieldChanges } = require('../../lib/document-ops'); // helpers under test
const { ensureUnique } = require('../../lib/database-utils'); // mocked uniqueness checker
const { testHelpers } = require('qtests/lib/envUtils.js');

describe('Document Ops Helper Functions', () => { // group helper tests
  let mockRes; // holds mock response

  beforeEach(() => {
    mockRes = testHelpers.createRes(); // standardized Express-like response mock
    jest.clearAllMocks(); // reset mock history
  });

  describe('validateDocumentUniqueness', () => { // tests uniqueness validator
    test('returns true when ensureUnique passes', async () => {
      ensureUnique.mockResolvedValue(true); // simulate unique document

      const result = await validateDocumentUniqueness('Model', { title: 'Doc' }, mockRes, 'Duplicate'); // invoke helper

      expect(result).toBe(true); // should propagate true
      expect(ensureUnique).toHaveBeenCalledWith('Model', { title: 'Doc' }, mockRes, 'Duplicate'); // ensure proper call
    });

    test('returns false when ensureUnique fails', async () => {
      ensureUnique.mockResolvedValue(false); // simulate duplicate detected

      const result = await validateDocumentUniqueness('Model', { title: 'Doc' }, mockRes, 'Duplicate'); // invoke helper

      expect(result).toBe(false); // should propagate false
      expect(ensureUnique).toHaveBeenCalledWith('Model', { title: 'Doc' }, mockRes, 'Duplicate'); // ensure proper call
    });
  });

  describe('hasUniqueFieldChanges', () => { // tests field change detection
    test('detects changed unique field', () => {
      const doc = { title: 'Old' }; // existing document
      const update = { title: 'New' }; // proposed update
      const uniqueQuery = { title: 'Old' }; // field considered unique

      const result = hasUniqueFieldChanges(doc, update, uniqueQuery); // invoke helper

      expect(result).toBe(true); // change should be detected
    });

    test('returns false when unique field unchanged', () => {
      const doc = { title: 'Same', body: 'a' }; // existing document
      const update = { body: 'b' }; // update does not touch unique field
      const uniqueQuery = { title: 'Same' }; // unique constraint

      const result = hasUniqueFieldChanges(doc, update, uniqueQuery); // invoke helper

      expect(result).toBe(false); // no unique change
    });

    test('returns false when uniqueQuery is null', () => {
      const doc = { title: 'Old' }; // existing document
      const update = { title: 'New' }; // proposed update

      const result = hasUniqueFieldChanges(doc, update, null); // call with no unique query

      expect(result).toBe(false); // should skip validation
    });
  });

  // no custom response mock needed; qtests provides helpers
});
