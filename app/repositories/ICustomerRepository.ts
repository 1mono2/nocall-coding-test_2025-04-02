import type { Customer } from "../models/Customer";

/**
 * 顧客リポジトリのインターフェース
 */
export interface ICustomerRepository {
	save(customer: Customer): Promise<void>;
	findById(id: string): Promise<Customer | null>;
	findAll(): Promise<Customer[]>;
	delete(id: string): Promise<void>;
}
