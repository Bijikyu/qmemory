import type { Model } from 'mongoose';

import {
  checkDuplicateByField,
  validateUniqueField,
  createUniqueValidator,
  handleDuplicateKeyError,
  createUniqueFieldMiddleware,
  createBatchUniqueChecker,
  type DuplicateError,
} from '../../lib/unique-validator.js';

interface TestDocument {
  _id: string;
  name?: string;
  email?: string;
  save?: jest.Mock<Promise<TestDocument>, []>;
}

type FindOneLeanResult = { lean: jest.Mock<Promise<TestDocument | null>, []> };

function createFindOneMock(): { findOne: jest.Mock<FindOneLeanResult, [unknown]>; lean: jest.Mock<Promise<TestDocument | null>, []> } {
  const lean = jest.fn<Promise<TestDocument | null>, []>();
  const findOne = jest.fn<FindOneLeanResult, [unknown]>().mockReturnValue({ lean });
  return { findOne, lean };
}

function buildMockModel(findOneImpl?: (query: unknown) => Promise<TestDocument | null>) {
  const { findOne, lean } = createFindOneMock();
  if (findOneImpl) {
    lean.mockImplementation(findOneImpl);
  }

  const findByIdSelectLean = jest.fn<Promise<TestDocument | null>, []>();
  const select = jest.fn().mockReturnValue({ lean: findByIdSelectLean });
  const findById = jest.fn().mockReturnValue({ select });

  const ModelCtor = function thisModel(this: TestDocument, data: Partial<TestDocument>) {
    Object.assign(this, data);
    this._id = data._id ?? 'generated-id';
    this.save = jest.fn().mockResolvedValue({ _id: this._id, ...data });
  } as unknown as Model<TestDocument>;

  Object.assign(ModelCtor, {
    findOne,
    findById,
  });

  return {
    Model: ModelCtor,
    mocks: {
      findOne,
      findOneLean: lean,
      findById,
      select,
      findByIdSelectLean,
    },
  };
}

describe('unique-validator utilities', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('checkDuplicateByField performs case-insensitive lookup', async () => {
    const existing: TestDocument = { _id: 'doc-1', email: 'upper@example.com' };
    const { Model, mocks } = buildMockModel(async () => existing);

    const result = await checkDuplicateByField(Model, 'email', 'UPPER@example.com');

    expect(result).toEqual(existing);
    const queryArg = mocks.findOne.mock.calls[0]?.[0] as Record<string, any>;
    expect(queryArg.email.$regex).toBeInstanceOf(RegExp);
    expect(queryArg.email.$regex.test('upper@example.com')).toBe(true);
  });

  test('validateUniqueField throws DuplicateError when duplicate exists', async () => {
    const { Model, mocks } = buildMockModel(async () => ({ _id: 'doc-2', name: 'Existing' }));

    await expect(
      validateUniqueField(Model, 'name', 'existing', null, 'widget'),
    ).rejects.toMatchObject<Partial<DuplicateError>>({
      code: 'DUPLICATE',
      status: 409,
      field: 'name',
      value: 'existing',
    });

    expect(mocks.findOne).toHaveBeenCalledTimes(1);
  });

  test('handleDuplicateKeyError wraps Mongo duplicate errors', () => {
    const mongoError = {
      code: 11000,
      keyValue: { email: 'taken@example.com' },
    };

    const wrapped = handleDuplicateKeyError(mongoError, 'user') as DuplicateError;

    expect(wrapped.code).toBe('DUPLICATE');
    expect(wrapped.status).toBe(409);
    expect(wrapped.field).toBe('email');
    expect(wrapped.value).toBe('taken@example.com');
  });

  test('createUniqueFieldMiddleware responds with 409 for duplicates', async () => {
    const duplicateDoc: TestDocument = { _id: 'doc-3', email: 'duplicate@example.com' };
    const { Model, mocks } = buildMockModel(async () => duplicateDoc);

    const middleware = createUniqueFieldMiddleware(Model, 'email', 'user');
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const next = jest.fn();

    const req = {
      body: { email: 'duplicate@example.com' },
      params: {},
    } as any;

    await middleware(req, { status } as any, next);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        field: 'email',
        code: 'DUPLICATE',
      }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(mocks.findOne).toHaveBeenCalled();
  });

  test('createBatchUniqueChecker segregates duplicate values', async () => {
    const { Model, mocks } = buildMockModel();

    mocks.findOneLean
      .mockResolvedValueOnce({ _id: 'a', name: 'Existing' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: 'b', name: 'Other' });

    const checker = createBatchUniqueChecker(Model, 'name');

    const result = await checker.checkMany(['Existing', 'New', 'Other']);

    expect(result.duplicates).toHaveLength(2);
    expect(result.unique).toEqual(['New']);
  });

  test('createUniqueValidator validates create and update paths', async () => {
    const { Model, mocks } = buildMockModel(async () => null);
    const validator = createUniqueValidator(Model, 'widget', 'name');

    await expect(
      validator.validateCreate({ name: 'Widget' }),
    ).resolves.toBeUndefined();

    mocks.findOneLean.mockResolvedValueOnce(null);

    await expect(
      validator.validateUpdate('doc-5', { name: 'Widget' }),
    ).resolves.toBeUndefined();
  });
});
