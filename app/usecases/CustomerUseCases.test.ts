import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  CreateCustomerUseCase,
  GetCustomerUseCase,
  GetAllCustomersUseCase,
  UpdateCustomerUseCase,
  DeleteCustomerUseCase
} from './CustomerUseCases';
import { ICustomerRepository } from '../repositories/ICustomerRepository';
import { ICallRepository } from '../repositories/ICallRepository';
import { Customer, CustomerVariable } from '../models/Customer';
import { Call } from '../models/Call';

// モックリポジトリの作成
const createCustomerRepositoryMock = () => {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
  } as unknown as ICustomerRepository;
};

const createCallRepositoryMock = () => {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllByCustomerId: vi.fn(),
    delete: vi.fn(),
  } as unknown as ICallRepository;
};

describe('CreateCustomerUseCase', () => {
  let customerRepo: ICustomerRepository;
  let useCase: CreateCustomerUseCase;
  
  beforeEach(() => {
    customerRepo = createCustomerRepositoryMock();
    useCase = new CreateCustomerUseCase(customerRepo);
  });
  
  it('基本情報で顧客を作成する', async () => {
    // Arrange
    const name = 'テスト顧客';
    const phoneNumber = '090-1234-5678';
    
    // Customer.createをスパイ
    const createSpy = vi.spyOn(Customer, 'create');
    (customerRepo.save as any).mockResolvedValue(undefined);
    
    // Act
    const result = await useCase.execute({ name, phoneNumber });
    
    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(createSpy).toHaveBeenCalledWith(name, phoneNumber);
    expect(customerRepo.save).toHaveBeenCalled();
  });
  
  it('電話番号なしで顧客を作成する', async () => {
    // Arrange
    const name = 'テスト顧客';
    
    // Customer.createをスパイ
    const createSpy = vi.spyOn(Customer, 'create');
    (customerRepo.save as any).mockResolvedValue(undefined);
    
    // Act
    const result = await useCase.execute({ name });
    
    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(createSpy).toHaveBeenCalledWith(name, undefined);
    expect(customerRepo.save).toHaveBeenCalled();
  });
  
  it('変数を持つ顧客を作成する', async () => {
    // Arrange
    const name = 'テスト顧客';
    const phoneNumber = '090-1234-5678';
    const variables = [
      { key: 'email', value: 'test@example.com' },
      { key: 'age', value: '30' }
    ];
    
    // モックCustomerインスタンス
    const mockCustomer = Customer.create(name, phoneNumber);
    const setVariableSpy = vi.spyOn(mockCustomer, 'setVariable');
    
    // createがモックCustomerを返すようにする
    vi.spyOn(Customer, 'create').mockReturnValue(mockCustomer);
    (customerRepo.save as any).mockResolvedValue(undefined);
    
    // Act
    const result = await useCase.execute({ name, phoneNumber, variables });
    
    // Assert
    expect(result).toBeDefined();
    expect(setVariableSpy).toHaveBeenCalledTimes(2);
    expect(setVariableSpy).toHaveBeenCalledWith('email', 'test@example.com');
    expect(setVariableSpy).toHaveBeenCalledWith('age', '30');
    expect(customerRepo.save).toHaveBeenCalledWith(mockCustomer);
  });
});

describe('GetCustomerUseCase', () => {
  let customerRepo: ICustomerRepository;
  let useCase: GetCustomerUseCase;
  
  beforeEach(() => {
    customerRepo = createCustomerRepositoryMock();
    useCase = new GetCustomerUseCase(customerRepo);
  });
  
  it('指定されたIDの顧客を返す', async () => {
    // Arrange
    const customerId = 'customer-123';
    const expectedCustomer = new Customer(customerId, 'テスト顧客');
    (customerRepo.findById as any).mockResolvedValue(expectedCustomer);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toBe(expectedCustomer);
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
  });
  
  it('顧客が存在しない場合はnullを返す', async () => {
    // Arrange
    const customerId = 'non-existent-customer';
    (customerRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toBeNull();
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
  });
});

describe('GetAllCustomersUseCase', () => {
  let customerRepo: ICustomerRepository;
  let useCase: GetAllCustomersUseCase;
  
  beforeEach(() => {
    customerRepo = createCustomerRepositoryMock();
    useCase = new GetAllCustomersUseCase(customerRepo);
  });
  
  it('すべての顧客を返す', async () => {
    // Arrange
    const expectedCustomers = [
      new Customer('customer-1', '顧客1'),
      new Customer('customer-2', '顧客2')
    ];
    (customerRepo.findAll as any).mockResolvedValue(expectedCustomers);
    
    // Act
    const result = await useCase.execute();
    
    // Assert
    expect(result).toEqual(expectedCustomers);
    expect(customerRepo.findAll).toHaveBeenCalled();
  });
  
  it('顧客がない場合は空の配列を返す', async () => {
    // Arrange
    (customerRepo.findAll as any).mockResolvedValue([]);
    
    // Act
    const result = await useCase.execute();
    
    // Assert
    expect(result).toEqual([]);
    expect(customerRepo.findAll).toHaveBeenCalled();
  });
});

describe('UpdateCustomerUseCase', () => {
  let customerRepo: ICustomerRepository;
  let useCase: UpdateCustomerUseCase;
  
  beforeEach(() => {
    customerRepo = createCustomerRepositoryMock();
    useCase = new UpdateCustomerUseCase(customerRepo);
  });
  
  it('顧客が存在しない場合はfalseを返す', async () => {
    // Arrange
    const customerId = 'non-existent-customer';
    (customerRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute({
      customerId,
      name: '更新顧客'
    });
    
    // Assert
    expect(result).toBe(false);
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
    expect(customerRepo.save).not.toHaveBeenCalled();
  });
  
  it('顧客が存在する場合は名前を更新して保存する', async () => {
    // Arrange
    const customerId = 'customer-123';
    const originalName = '元の名前';
    const updatedName = '更新後の名前';
    const customer = new Customer(customerId, originalName);
    (customerRepo.findById as any).mockResolvedValue(customer);
    
    // Act
    const result = await useCase.execute({
      customerId,
      name: updatedName
    });
    
    // Assert
    expect(result).toBe(true);
    expect(customer.name).toBe(updatedName);
    expect(customerRepo.save).toHaveBeenCalledWith(customer);
  });
  
  it('顧客が存在する場合は電話番号を更新して保存する', async () => {
    // Arrange
    const customerId = 'customer-123';
    const originalPhone = '090-1111-2222';
    const updatedPhone = '090-3333-4444';
    const customer = new Customer(customerId, '顧客名', originalPhone);
    (customerRepo.findById as any).mockResolvedValue(customer);
    
    // Act
    const result = await useCase.execute({
      customerId,
      name: '顧客名',
      phoneNumber: updatedPhone
    });
    
    // Assert
    expect(result).toBe(true);
    expect(customer.phoneNumber).toBe(updatedPhone);
    expect(customerRepo.save).toHaveBeenCalledWith(customer);
  });
  
  it('顧客が存在する場合に変数を追加する', async () => {
    // Arrange
    const customerId = 'customer-123';
    const customer = new Customer(customerId, '顧客名');
    const setVariableSpy = vi.spyOn(customer, 'setVariable');
    (customerRepo.findById as any).mockResolvedValue(customer);
    
    const variables = [
      { key: 'email', value: 'updated@example.com' },
      { key: 'age', value: '35' }
    ];
    
    // Act
    const result = await useCase.execute({
      customerId,
      name: '顧客名',
      variables
    });
    
    // Assert
    expect(result).toBe(true);
    expect(setVariableSpy).toHaveBeenCalledTimes(2);
    expect(setVariableSpy).toHaveBeenCalledWith('email', 'updated@example.com');
    expect(setVariableSpy).toHaveBeenCalledWith('age', '35');
    expect(customerRepo.save).toHaveBeenCalledWith(customer);
  });
});

describe('DeleteCustomerUseCase', () => {
  let customerRepo: ICustomerRepository;
  let callRepo: ICallRepository;
  let useCase: DeleteCustomerUseCase;
  
  beforeEach(() => {
    customerRepo = createCustomerRepositoryMock();
    callRepo = createCallRepositoryMock();
    useCase = new DeleteCustomerUseCase(customerRepo, callRepo);
  });
  
  it('顧客が存在しない場合はfalseを返す', async () => {
    // Arrange
    const customerId = 'non-existent-customer';
    (customerRepo.findById as any).mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toBe(false);
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
    expect(customerRepo.delete).not.toHaveBeenCalled();
  });
  
  it('顧客が存在する場合は削除して関連するコールも削除する', async () => {
    // Arrange
    const customerId = 'customer-123';
    const customer = new Customer(customerId, '削除対象顧客');
    const calls = [
      Call.create(customerId),
      Call.create(customerId)
    ];
    
    (customerRepo.findById as any).mockResolvedValue(customer);
    (callRepo.findAllByCustomerId as any).mockResolvedValue(calls);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toBe(true);
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
    expect(callRepo.findAllByCustomerId).toHaveBeenCalledWith(customerId);
    expect(callRepo.delete).toHaveBeenCalledTimes(2);
    expect(customerRepo.delete).toHaveBeenCalledWith(customerId);
  });
  
  it('顧客が存在し関連するコールがない場合は顧客のみ削除する', async () => {
    // Arrange
    const customerId = 'customer-123';
    const customer = new Customer(customerId, '削除対象顧客');
    
    (customerRepo.findById as any).mockResolvedValue(customer);
    (callRepo.findAllByCustomerId as any).mockResolvedValue([]);
    
    // Act
    const result = await useCase.execute(customerId);
    
    // Assert
    expect(result).toBe(true);
    expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
    expect(callRepo.findAllByCustomerId).toHaveBeenCalledWith(customerId);
    expect(callRepo.delete).not.toHaveBeenCalled();
    expect(customerRepo.delete).toHaveBeenCalledWith(customerId);
  });
});
