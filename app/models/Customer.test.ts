import { describe, it, expect, beforeEach } from "vitest";
import { Customer, CustomerVariable } from "./Customer";

describe("CustomerVariable", () => {
  describe("create", () => {
    it("顧客変数を正しく作成できること", () => {
      // given
      const customerId = "test-customer-id";
      const key = "test-key";
      const value = "test-value";

      // when
      const variable = CustomerVariable.create(customerId, key, value);

      // then
      expect(variable).toBeInstanceOf(CustomerVariable);
      expect(variable.customerId).toBe(customerId);
      expect(variable.key).toBe(key);
      expect(variable.value).toBe(value);
      expect(variable.id).toBeDefined();
      expect(typeof variable.id).toBe("string");
    });
  });
});

describe("Customer", () => {
  let customer: Customer;
  const customerName = "テスト顧客";
  const phoneNumber = "03-1234-5678";

  beforeEach(() => {
    // 各テストケース前に新しいCustomerインスタンスを作成
    customer = Customer.create(customerName, phoneNumber);
  });

  describe("create", () => {
    it("新しい顧客を正しく作成できること", () => {
      // then
      expect(customer).toBeInstanceOf(Customer);
      expect(customer.name).toBe(customerName);
      expect(customer.phoneNumber).toBe(phoneNumber);
      expect(customer.customerId).toBeDefined();
      expect(typeof customer.customerId).toBe("string");
    });

    it("電話番号なしで顧客を作成できること", () => {
      // when
      const customerWithoutPhone = Customer.create(customerName);

      // then
      expect(customerWithoutPhone).toBeInstanceOf(Customer);
      expect(customerWithoutPhone.name).toBe(customerName);
      expect(customerWithoutPhone.phoneNumber).toBeUndefined();
    });
  });

  describe("顧客変数の操作", () => {
    it("変数を設定し取得できること", () => {
      // given
      const key = "testKey";
      const value = "testValue";

      // when
      const variable = customer.setVariable(key, value);

      // then
      expect(variable).toBeInstanceOf(CustomerVariable);
      expect(variable.key).toBe(key);
      expect(variable.value).toBe(value);

      // getVariableでも同じ値が取得できることを確認
      const retrievedVariable = customer.getVariable(key);
      expect(retrievedVariable).toBeDefined();
      expect(retrievedVariable?.value).toBe(value);
    });

    it("存在しない変数を取得しようとするとundefinedが返ること", () => {
      // when
      const variable = customer.getVariable("nonExistentKey");

      // then
      expect(variable).toBeUndefined();
    });

    it("変数を削除できること", () => {
      // given
      const key = "keyToRemove";
      customer.setVariable(key, "someValue");

      // when
      const result = customer.removeVariable(key);

      // then
      expect(result).toBe(true);
      expect(customer.getVariable(key)).toBeUndefined();
    });

    it("存在しない変数を削除しようとするとfalseが返ること", () => {
      // when
      const result = customer.removeVariable("nonExistentKey");

      // then
      expect(result).toBe(false);
    });

    it("すべての変数を取得できること", () => {
      // given
      customer.setVariable("key1", "value1");
      customer.setVariable("key2", "value2");
      customer.setVariable("key3", "value3");

      // when
      const variables = customer.getAllVariables();

      // then
      expect(variables).toHaveLength(3);
      expect(variables.map((v) => v.key)).toContain("key1");
      expect(variables.map((v) => v.key)).toContain("key2");
      expect(variables.map((v) => v.key)).toContain("key3");
    });

    it("変数を上書きできること", () => {
      // given
      const key = "updateKey";
      const initialValue = "initialValue";
      const updatedValue = "updatedValue";

      // when
      customer.setVariable(key, initialValue);
      const updatedVariable = customer.setVariable(key, updatedValue);

      // then
      expect(updatedVariable.value).toBe(updatedValue);
      expect(customer.getVariable(key)?.value).toBe(updatedValue);
    });
  });

  describe("コンストラクタ", () => {
    it("初期変数を設定できること", () => {
      // given
      const customerId = "custom-id";
      const name = "カスタム顧客";
      const variables = [
        new CustomerVariable("var-id-1", customerId, "key1", "value1"),
        new CustomerVariable("var-id-2", customerId, "key2", "value2"),
      ];

      // when
      const customerWithVariables = new Customer(
        customerId,
        name,
        undefined,
        variables
      );

      // then
      expect(customerWithVariables.getAllVariables()).toHaveLength(2);
      expect(customerWithVariables.getVariable("key1")?.value).toBe("value1");
      expect(customerWithVariables.getVariable("key2")?.value).toBe("value2");
    });
  });
});
