import { Customer } from "../models/Customer";
import { ICustomerRepository } from "../repositories/ICustomerRepository";

/**
 * 顧客作成ユースケース
 */
export class CreateCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  public async execute(input: {
    name: string;
    phoneNumber?: string;
    variables?: Record<string, string>;
  }): Promise<string> {
    const customer = Customer.create(input.name, input.phoneNumber);

    // 変数を設定
    if (input.variables) {
      Object.entries(input.variables).forEach(([key, value]) => {
        customer.setVariable(key, value);
      });
    }

    await this.customerRepo.save(customer);
    return customer.customerId;
  }
}

/**
 * 顧客詳細取得ユースケース
 */
export class GetCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  public async execute(customerId: string): Promise<Customer | null> {
    return this.customerRepo.findById(customerId);
  }
}

/**
 * 全顧客取得ユースケース
 */
export class GetAllCustomersUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  public async execute(): Promise<Customer[]> {
    return this.customerRepo.findAll();
  }
}

/**
 * 顧客更新ユースケース
 */
export class UpdateCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  public async execute(input: {
    customerId: string;
    name: string;
    phoneNumber?: string;
    variables?: Record<string, string>;
  }): Promise<boolean> {
    const customer = await this.customerRepo.findById(input.customerId);

    if (!customer) {
      return false;
    }

    // 新しい顧客を作成（イミュータブルなので更新ではなく新規作成）
    const updatedCustomer = new Customer(
      input.customerId,
      input.name,
      input.phoneNumber,
      customer.getAllVariables()
    );

    // 変数を設定
    if (input.variables) {
      Object.entries(input.variables).forEach(([key, value]) => {
        updatedCustomer.setVariable(key, value);
      });
    }

    await this.customerRepo.save(updatedCustomer);
    return true;
  }
}

/**
 * 顧客削除ユースケース
 */
export class DeleteCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  public async execute(customerId: string): Promise<boolean> {
    const customer = await this.customerRepo.findById(customerId);

    if (!customer) {
      return false;
    }

    await this.customerRepo.delete(customerId);
    return true;
  }
}
