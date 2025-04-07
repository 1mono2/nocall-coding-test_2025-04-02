import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CustomerRepository } from "./CustomerRepository";
import { Customer, CustomerVariable } from "../models/Customer";
import { createTestDb } from "./test-helpers/test-db";
import { DatabaseClient } from "../db";

describe("CustomerRepository", () => {
  let repository: CustomerRepository;
  let testCustomer: Customer;
  let testDb: DatabaseClient;

  beforeEach(() => {
    testDb = createTestDb();
    repository = new CustomerRepository(testDb);

    // テスト用の顧客データを作成
    const variable = new CustomerVariable(
      "var-id-1",
      "customer-id-1",
      "favorite-color",
      "blue"
    );
    testCustomer = new Customer("customer-id-1", "テスト顧客", "03-1234-5678", [
      variable,
    ]);
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    vi.resetAllMocks();
  });

  describe("save", () => {
    it("顧客情報が正しく保存されること", async () => {
      await repository.save(testCustomer);

      const savedCustomer = await repository.findById(testCustomer.customerId);
      expect(savedCustomer).not.toBeNull();
      expect(savedCustomer?.customerId).toBe(testCustomer.customerId);
      expect(savedCustomer?.name).toBe(testCustomer.name);
      expect(savedCustomer?.phoneNumber).toBe(testCustomer.phoneNumber);

      expect(savedCustomer?.getAllVariables().length).toBe(1);
      expect(savedCustomer?.getAllVariables()[0].key).toBe("favorite-color");
      expect(savedCustomer?.getAllVariables()[0].value).toBe("blue");
    });

    it("変数がない顧客の場合も保存できること", async () => {
      const customerWithoutVariables = new Customer(
        "customer-id-2",
        "変数なし顧客",
        undefined,
        []
      );

      await repository.save(customerWithoutVariables);

      const savedCustomer = await repository.findById(
        customerWithoutVariables.customerId
      );
      expect(savedCustomer).not.toBeNull();
      expect(savedCustomer?.customerId).toBe(
        customerWithoutVariables.customerId
      );
      expect(savedCustomer?.name).toBe(customerWithoutVariables.name);
      expect(savedCustomer?.phoneNumber).toBeUndefined();
      expect(savedCustomer?.getAllVariables().length).toBe(0);
    });
  });

  describe("findById", () => {
    it("存在する顧客IDを指定した場合、顧客オブジェクトが返されること", async () => {
      await repository.save(testCustomer);

      const result = await repository.findById(testCustomer.customerId);

      expect(result).not.toBeNull();
      expect(result?.customerId).toBe(testCustomer.customerId);
      expect(result?.name).toBe(testCustomer.name);
      expect(result?.phoneNumber).toBe(testCustomer.phoneNumber);
      expect(result?.getAllVariables().length).toBe(1);
      expect(result?.getAllVariables()[0].key).toBe("favorite-color");
      expect(result?.getAllVariables()[0].value).toBe("blue");
    });

    it("存在しない顧客IDを指定した場合、nullが返されること", async () => {
      const result = await repository.findById("non-existent-id");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("全ての顧客が取得できること", async () => {
      const customer1 = testCustomer;

      const customer2 = new Customer("customer-id-2", "顧客2", undefined, []);

      const customer3 = new Customer(
        "customer-id-3",
        "顧客3",
        "090-1234-5678",
        [
          new CustomerVariable("var-id-2", "customer-id-3", "age", "30"),
          new CustomerVariable(
            "var-id-3",
            "customer-id-3",
            "address",
            "東京都渋谷区"
          ),
        ]
      );

      await repository.save(customer1);
      await repository.save(customer2);
      await repository.save(customer3);

      const results = await repository.findAll();

      expect(results.length).toBe(3);

      // IDでソート
      const sortedResults = results.sort((a, b) =>
        a.customerId.localeCompare(b.customerId)
      );

      expect(sortedResults[0].customerId).toBe("customer-id-1");
      expect(sortedResults[0].name).toBe("テスト顧客");
      expect(sortedResults[0].getAllVariables().length).toBe(1);

      expect(sortedResults[1].customerId).toBe("customer-id-2");
      expect(sortedResults[1].name).toBe("顧客2");
      expect(sortedResults[1].getAllVariables().length).toBe(0);

      expect(sortedResults[2].customerId).toBe("customer-id-3");
      expect(sortedResults[2].name).toBe("顧客3");
      expect(sortedResults[2].getAllVariables().length).toBe(2);

      const customer3Vars = sortedResults[2].getAllVariables();
      expect(customer3Vars.find((v) => v.key === "age")?.value).toBe("30");
      expect(customer3Vars.find((v) => v.key === "address")?.value).toBe(
        "東京都渋谷区"
      );
    });

    it("顧客が存在しない場合、空配列が返されること", async () => {
      const results = await repository.findAll();

      expect(results).toEqual([]);
      expect(results.length).toBe(0);
    });
  });

  describe("delete", () => {
    it("指定したIDの顧客が削除されること", async () => {
      await repository.save(testCustomer);

      const beforeDelete = await repository.findById(testCustomer.customerId);
      expect(beforeDelete).not.toBeNull();

      await repository.delete(testCustomer.customerId);

      const afterDelete = await repository.findById(testCustomer.customerId);
      expect(afterDelete).toBeNull();
      const allCustomers = await repository.findAll();
      expect(allCustomers.length).toBe(0);
    });
  });
});
