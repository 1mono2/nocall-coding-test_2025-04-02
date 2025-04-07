import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  RequestCallUseCase, 
  StartCallUseCase, 
  CompleteCallUseCase,
  CancelCallUseCase,
  GetCallUseCase,
  GetCallsByCustomerUseCase,
  GetAllCallsUseCase
} from './CallUseCases';
import { ICallRepository } from '../repositories/ICallRepository';
import { ICustomerRepository } from '../repositories/ICustomerRepository';
import { Call } from '../models/Call';
import { Customer } from '../models/Customer';

// モックリポジトリの作成
const createCallRepositoryMock = () => {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllByCustomerId: vi.fn(),
    delete: vi.fn(),
  } as unknown as ICallRepository;
};

const createCustomerRepositoryMock = () => {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
  } as unknown as ICustomerRepository;
};

describe('RequestCallUseCase', () => {
  let callRepo: ICallRepository;
  let customerRepo: ICustomerRepository;
  let useCase: RequestCallUseCase;
  let customerId: string;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    customerRepo = createCustomerRepositoryMock();
    useCase = new RequestCallUseCase(callRepo, customerRepo);
    customerId = 'customer-123';
  });
  
  it('顧客が存在しない場合はnullを返す', async () => {
    // Arrange
    (customerRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute({ customerId });
    
    // Assert
    expect(result).toBeNull();
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
    expect(callRepo.save).not.toHaveBeenCalled();
  });
  
  it('顧客が存在する場合は新しいコールを作成して保存する', async () => {
    // Arrange
    const mockedCustomer = new Customer(customerId, 'テスト顧客');
    const requestedAt = new Date();
    (customerRepo.findById as any).mockResolvedValue(mockedCustomer);
    
    // Call.createをスパイして、作成されるCallオブジェクトを追跡
    const createSpy = vi.spyOn(Call, 'create');
    
    // Act
    const result = await useCase.execute({ customerId, requestedAt });
    
    // Assert
    expect(result).not.toBeNull();
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
    expect(createSpy).toHaveBeenCalledWith(customerId, requestedAt);
    expect(callRepo.save).toHaveBeenCalled();
  });
  
  it('requestedAtが指定されていない場合は現在時刻が使われる', async () => {
    // Arrange
    const mockedCustomer = new Customer(customerId, 'テスト顧客');
    (customerRepo.findById as any).mockResolvedValue(mockedCustomer);
    
    // Call.createをスパイ
    const createSpy = vi.spyOn(Call, 'create');
    const beforeTest = new Date();
    
    // Act
    const result = await useCase.execute({ customerId });
    
    // Assert
    expect(result).not.toBeNull();
    // Call.createの呼び出し引数を取得
    const createArgs = createSpy.mock.calls[0];
    // 第2引数の日時が現在時刻であることを確認（許容範囲内）
    const usedDate = createArgs[1] as Date;
    expect(usedDate.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(usedDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});

describe('StartCallUseCase', () => {
  let callRepo: ICallRepository;
  let useCase: StartCallUseCase;
  let callId: string;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    useCase = new StartCallUseCase(callRepo);
    callId = 'call-123';
  });
  
  it('コールが存在しない場合はfalseを返す', async () => {
    // Arrange
    (callRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(false);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(callRepo.save).not.toHaveBeenCalled();
  });
  
  it('コールが存在する場合はコールを開始して保存する', async () => {
    // Arrange
    const mockedCall = Call.create('customer-123');
    const startCallSpy = vi.spyOn(mockedCall, 'startCall');
    (callRepo.findById as any).mockResolvedValue(mockedCall);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(true);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(startCallSpy).toHaveBeenCalled();
    expect(callRepo.save).toHaveBeenCalledWith(mockedCall);
  });
  
  it('コール開始中にエラーが発生した場合はfalseを返す', async () => {
    // Arrange
    const mockedCall = Call.create('customer-123');
    vi.spyOn(mockedCall, 'startCall').mockImplementation(() => {
      throw new Error('テストエラー');
    });
    (callRepo.findById as any).mockResolvedValue(mockedCall);
    
    // コンソールエラーをスパイ
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(false);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(consoleSpy).toHaveBeenCalled();
    expect(callRepo.save).not.toHaveBeenCalled();
  });
});

describe('CompleteCallUseCase', () => {
  let callRepo: ICallRepository;
  let useCase: CompleteCallUseCase;
  let callId: string;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    useCase = new CompleteCallUseCase(callRepo);
    callId = 'call-123';
  });
  
  it('コールが存在しない場合はfalseを返す', async () => {
    // Arrange
    (callRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(false);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(callRepo.save).not.toHaveBeenCalled();
  });
  
  it('コールが存在する場合はコールを完了して保存する', async () => {
    // Arrange
    const mockedCall = Call.create('customer-123');
    // コールを開始しておく
    mockedCall.startCall();
    const completeCallSpy = vi.spyOn(mockedCall, 'completeCall');
    (callRepo.findById as any).mockResolvedValue(mockedCall);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(true);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(completeCallSpy).toHaveBeenCalled();
    expect(callRepo.save).toHaveBeenCalledWith(mockedCall);
  });
});

describe('CancelCallUseCase', () => {
  let callRepo: ICallRepository;
  let useCase: CancelCallUseCase;
  let callId: string;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    useCase = new CancelCallUseCase(callRepo);
    callId = 'call-123';
  });
  
  it('コールが存在しない場合はfalseを返す', async () => {
    // Arrange
    (callRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(false);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(callRepo.save).not.toHaveBeenCalled();
  });
  
  it('コールが存在する場合はコールをキャンセルして保存する', async () => {
    // Arrange
    const mockedCall = Call.create('customer-123');
    const cancelCallSpy = vi.spyOn(mockedCall, 'cancelCall');
    (callRepo.findById as any).mockResolvedValue(mockedCall);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(true);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
    expect(cancelCallSpy).toHaveBeenCalled();
    expect(callRepo.save).toHaveBeenCalledWith(mockedCall);
  });
});

describe('GetCallUseCase', () => {
  let callRepo: ICallRepository;
  let useCase: GetCallUseCase;
  let callId: string;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    useCase = new GetCallUseCase(callRepo);
    callId = 'call-123';
  });
  
  it('指定されたIDのコールを返す', async () => {
    // Arrange
    const expectedCall = Call.create('customer-123');
    (callRepo.findById as any).mockResolvedValue(expectedCall);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBe(expectedCall);
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
  });
  
  it('コールが存在しない場合はnullを返す', async () => {
    // Arrange
    (callRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(callId);
    
    // Assert
    expect(result).toBeNull();
    expect(callRepo.findById).toHaveBeenCalledWith(callId);
  });
});

describe('GetCallsByCustomerUseCase', () => {
  let callRepo: ICallRepository;
  let useCase: GetCallsByCustomerUseCase;
  let customerId: string;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    useCase = new GetCallsByCustomerUseCase(callRepo);
    customerId = 'customer-123';
  });
  
  it('指定された顧客IDのコール一覧を返す', async () => {
    // Arrange
    const expectedCalls = [
      Call.create(customerId),
      Call.create(customerId)
    ];
    (callRepo.findAllByCustomerId as any).mockResolvedValue(expectedCalls);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toEqual(expectedCalls);
    expect(callRepo.findAllByCustomerId).toHaveBeenCalledWith(customerId);
  });
  
  it('コールがない場合は空の配列を返す', async () => {
    // Arrange
    (callRepo.findAllByCustomerId as any).mockResolvedValue([]);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toEqual([]);
    expect(callRepo.findAllByCustomerId).toHaveBeenCalledWith(customerId);
  });
});

describe('GetAllCallsUseCase', () => {
  let callRepo: ICallRepository;
  let useCase: GetAllCallsUseCase;
  
  beforeEach(() => {
    callRepo = createCallRepositoryMock();
    useCase = new GetAllCallsUseCase(callRepo);
  });
  
  it('すべてのコールを返す', async () => {
    // Arrange
    const expectedCalls = [
      Call.create('customer-1'),
      Call.create('customer-2')
    ];
    (callRepo.findAll as any).mockResolvedValue(expectedCalls);
    
    // Act
    const result = await useCase.execute();
    
    // Assert
    expect(result).toEqual(expectedCalls);
    expect(callRepo.findAll).toHaveBeenCalled();
  });
  
  it('コールがない場合は空の配列を返す', async () => {
    // Arrange
    (callRepo.findAll as any).mockResolvedValue([]);
    
    // Act
    const result = await useCase.execute();
    
    // Assert
    expect(result).toEqual([]);
    expect(callRepo.findAll).toHaveBeenCalled();
  });
});
