import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { Call } from "../models/Call";
import { Customer } from "../models/Customer";
import type { ICallRepository } from "../repositories/ICallRepository";
import type { ICustomerRepository } from "../repositories/ICustomerRepository";
import {
	CreateCustomerUseCase,
	DeleteCustomerUseCase,
	GetAllCustomersUseCase,
	GetCustomerUseCase,
	UpdateCustomerUseCase,
} from "./CustomerUseCases";

// モックリポジトリの作成
const createCustomerRepositoryMock = (): ICustomerRepository => {
	return {
		save: vi.fn(),
		findById: vi.fn(),
		findAll: vi.fn(),
		delete: vi.fn(),
	};
};

const createCallRepositoryMock = (): ICallRepository => {
	return {
		save: vi.fn(),
		findById: vi.fn(),
		findAll: vi.fn(),
		findAllByCustomerId: vi.fn(),
		delete: vi.fn(),
	};
};

describe("CreateCustomerUseCase", () => {
	let customerRepo: ICustomerRepository;
	let useCase: CreateCustomerUseCase;

	beforeEach(() => {
		customerRepo = createCustomerRepositoryMock();
		useCase = new CreateCustomerUseCase(customerRepo);
	});

	it("基本情報で顧客を作成する", async () => {
		// Arrange
		const name = "テスト顧客";
		const phoneNumber = "090-1234-5678";

		// Customer.createをスパイ
		const createSpy = vi.spyOn(Customer, "create");
		vi.mocked(customerRepo.save).mockResolvedValue(undefined);

		// Act
		const result = await useCase.execute({ name, phoneNumber });

		// Assert
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(createSpy).toHaveBeenCalledWith(name, phoneNumber);
		expect(customerRepo.save).toHaveBeenCalled();
	});

	it("電話番号なしで顧客を作成する", async () => {
		// Arrange
		const name = "テスト顧客";

		// Customer.createをスパイ
		const createSpy = vi.spyOn(Customer, "create");
		vi.mocked(customerRepo.save).mockResolvedValue(undefined);

		// Act
		const result = await useCase.execute({ name });

		// Assert
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(createSpy).toHaveBeenCalledWith(name, undefined);
		expect(customerRepo.save).toHaveBeenCalled();
	});

	it("変数を持つ顧客を作成する", async () => {
		// Arrange
		const name = "テスト顧客";
		const phoneNumber = "090-1234-5678";
		const variables = [
			{ key: "email", value: "test@example.com" },
			{ key: "age", value: "30" },
		];

		// モックCustomerインスタンス
		const mockCustomer = Customer.create(name, phoneNumber);
		const setVariableSpy = vi.spyOn(mockCustomer, "setVariable");

		// createがモックCustomerを返すようにする
		vi.spyOn(Customer, "create").mockReturnValue(mockCustomer);
		vi.mocked(customerRepo.save).mockResolvedValue(undefined);

		// Act
		const result = await useCase.execute({ name, phoneNumber, variables });

		// Assert
		expect(result).toBeDefined();
		expect(setVariableSpy).toHaveBeenCalledTimes(2);
		expect(setVariableSpy).toHaveBeenCalledWith("email", "test@example.com");
		expect(setVariableSpy).toHaveBeenCalledWith("age", "30");
		expect(customerRepo.save).toHaveBeenCalledWith(mockCustomer);
	});
});

describe("GetCustomerUseCase", () => {
	let customerRepo: ICustomerRepository;
	let useCase: GetCustomerUseCase;

	beforeEach(() => {
		customerRepo = createCustomerRepositoryMock();
		useCase = new GetCustomerUseCase(customerRepo);
	});

	it("指定されたIDの顧客を返す", async () => {
		// Arrange
		const customerId = "customer-123";
		const expectedCustomer = new Customer(customerId, "テスト顧客");
		vi.mocked(customerRepo.findById).mockResolvedValue(expectedCustomer);

		// Act
		const result = await useCase.execute(customerId);

		// Assert
		expect(result).toBe(expectedCustomer);
		expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
	});

	it("顧客が存在しない場合はnullを返す", async () => {
		// Arrange
		const customerId = "non-existent-customer";
		vi.mocked(customerRepo.findById).mockResolvedValue(null);

		// Act
		const result = await useCase.execute(customerId);

		// Assert
		expect(result).toBeNull();
		expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
	});
});

describe("GetAllCustomersUseCase", () => {
	let customerRepo: ICustomerRepository;
	let useCase: GetAllCustomersUseCase;

	beforeEach(() => {
		customerRepo = createCustomerRepositoryMock();
		useCase = new GetAllCustomersUseCase(customerRepo);
	});

	it("すべての顧客を返す", async () => {
		// Arrange
		const expectedCustomers = [
			new Customer("customer-1", "顧客1"),
			new Customer("customer-2", "顧客2"),
		];
		vi.mocked(customerRepo.findAll).mockResolvedValue(expectedCustomers);

		// Act
		const result = await useCase.execute();

		// Assert
		expect(result).toEqual(expectedCustomers);
		expect(customerRepo.findAll).toHaveBeenCalled();
	});

	it("顧客がない場合は空の配列を返す", async () => {
		// Arrange
		vi.mocked(customerRepo.findAll).mockResolvedValue([]);

		// Act
		const result = await useCase.execute();

		// Assert
		expect(result).toEqual([]);
		expect(customerRepo.findAll).toHaveBeenCalled();
	});
});

describe("UpdateCustomerUseCase", () => {
	let customerRepo: ICustomerRepository;
	let useCase: UpdateCustomerUseCase;

	beforeEach(() => {
		customerRepo = createCustomerRepositoryMock();
		useCase = new UpdateCustomerUseCase(customerRepo);
	});

	it("顧客が存在しない場合はfalseを返す", async () => {
		// Arrange
		const customerId = "non-existent-customer";
		vi.mocked(customerRepo.findById).mockResolvedValue(null);

		// Act
		const result = await useCase.execute({
			customerId,
			name: "更新顧客",
		});

		// Assert
		expect(result).toBe(false);
		expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
		expect(customerRepo.save).not.toHaveBeenCalled();
	});

	it("顧客が存在する場合は名前を更新して保存する", async () => {
		// Arrange
		const customerId = "customer-123";
		const originalName = "元の名前";
		const updatedName = "更新後の名前";
		const customer = new Customer(customerId, originalName);
		vi.mocked(customerRepo.findById).mockResolvedValue(customer);

		// 保存されるべき新しい顧客オブジェクトをキャプチャするためのモック実装
		vi.mocked(customerRepo.save).mockImplementation(
			(savedCustomer: Customer) => {
				// 保存されるカスタマーをキャプチャして検証に使用
				expect(savedCustomer.customerId).toBe(customerId);
				expect(savedCustomer.name).toBe(updatedName);
				return Promise.resolve();
			},
		);

		// Act
		const result = await useCase.execute({
			customerId,
			name: updatedName,
		});

		// Assert
		expect(result).toBe(true);
		expect(customerRepo.save).toHaveBeenCalled();
	});

	it("顧客が存在する場合は電話番号を更新して保存する", async () => {
		// Arrange
		const customerId = "customer-123";
		const originalPhone = "090-1111-2222";
		const updatedPhone = "090-3333-4444";
		const customer = new Customer(customerId, "顧客名", originalPhone);
		vi.mocked(customerRepo.findById).mockResolvedValue(customer);

		// 保存されるべき新しい顧客オブジェクトをキャプチャするためのモック実装
		vi.mocked(customerRepo.save).mockImplementation(
			(savedCustomer: Customer) => {
				// 保存されるカスタマーをキャプチャして検証に使用
				expect(savedCustomer.customerId).toBe(customerId);
				expect(savedCustomer.name).toBe("顧客名");
				expect(savedCustomer.phoneNumber).toBe(updatedPhone);
				return Promise.resolve();
			},
		);

		// Act
		const result = await useCase.execute({
			customerId,
			name: "顧客名",
			phoneNumber: updatedPhone,
		});

		// Assert
		expect(result).toBe(true);
		expect(customerRepo.save).toHaveBeenCalled();
	});

	it("顧客が存在する場合に変数を追加する", async () => {
		// Arrange
		const customerId = "customer-123";
		const customer = new Customer(customerId, "顧客名");

		// mockResolvedValueを型安全に使用
		vi.mocked(customerRepo.findById).mockResolvedValue(customer);

		const variables = [
			{ key: "email", value: "updated@example.com" },
			{ key: "age", value: "35" },
		];

		// Act
		const result = await useCase.execute({
			customerId,
			name: "顧客名",
			variables,
		});

		// Assert
		expect(result).toBe(true);

		// customerRepo.saveが期待する引数で呼ばれたことを確認
		expect(customerRepo.save).toHaveBeenCalledWith(
			expect.objectContaining({
				customerId,
				name: "顧客名",
			}),
		);

		// 実際に保存された顧客オブジェクトを取得
		const savedCustomer = vi.mocked(customerRepo.save).mock.calls[0][0];

		// 変数が正しく設定されているか確認
		const savedVariables = savedCustomer.getAllVariables();

		// 変数の数が正しいことを確認
		expect(savedVariables).toHaveLength(2);

		// 全ての必要な変数が含まれていることを確認
		expect(savedVariables).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					key: "email",
					value: "updated@example.com",
				}),
				expect.objectContaining({
					key: "age",
					value: "35",
				}),
			]),
		);
	});
});

describe("DeleteCustomerUseCase", () => {
	let customerRepo: ICustomerRepository;
	let callRepo: ICallRepository;
	let useCase: DeleteCustomerUseCase;

	beforeEach(() => {
		customerRepo = createCustomerRepositoryMock();
		callRepo = createCallRepositoryMock();
		useCase = new DeleteCustomerUseCase(customerRepo, callRepo);
	});

	it("顧客が存在しない場合はfalseを返す", async () => {
		// Arrange
		const customerId = "non-existent-customer";
		vi.mocked(customerRepo.findById).mockResolvedValue(null);

		// Act
		const result = await useCase.execute(customerId);

		// Assert
		expect(result).toBe(false);
		expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
		expect(customerRepo.delete).not.toHaveBeenCalled();
	});

	it("顧客が存在する場合は削除して関連するコールも削除する", async () => {
		// Arrange
		const customerId = "customer-123";
		const customer = new Customer(customerId, "削除対象顧客");
		const calls = [Call.create(customerId), Call.create(customerId)];

		vi.mocked(customerRepo.findById).mockResolvedValue(customer);
		vi.mocked(callRepo.findAllByCustomerId).mockResolvedValue(calls);

		// Act
		const result = await useCase.execute(customerId);

		// Assert
		expect(result).toBe(true);
		expect(customerRepo.findById).toHaveBeenCalledWith(customerId);
		expect(callRepo.findAllByCustomerId).toHaveBeenCalledWith(customerId);
		expect(callRepo.delete).toHaveBeenCalledTimes(2);
		expect(customerRepo.delete).toHaveBeenCalledWith(customerId);
	});

	it("顧客が存在し関連するコールがない場合は顧客のみ削除する", async () => {
		// Arrange
		const customerId = "customer-123";
		const customer = new Customer(customerId, "削除対象顧客");

		vi.mocked(customerRepo.findById).mockResolvedValue(customer);
		vi.mocked(callRepo.findAllByCustomerId).mockResolvedValue([]);

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
