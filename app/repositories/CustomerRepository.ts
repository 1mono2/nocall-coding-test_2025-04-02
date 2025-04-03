import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { customers, customerVariables } from "../db/schema";
import { Customer, CustomerVariable } from "../models/Customer";
import { ICustomerRepository } from "./ICustomerRepository";

/**
 * 顧客リポジトリの実装
 */
export class CustomerRepository implements ICustomerRepository {
  /**
   * 顧客を保存（新規作成または更新）
   */
  async save(customer: Customer): Promise<void> {
    // トランザクション開始
    await db.transaction(async (tx) => {
      // 顧客情報を保存
      await tx
        .insert(customers)
        .values({
          customerId: customer.customerId,
          name: customer.name,
          phoneNumber: customer.phoneNumber || null,
        })
        .onConflictDoUpdate({
          target: customers.customerId,
          set: {
            name: customer.name,
            phoneNumber: customer.phoneNumber || null,
            updatedAt: new Date(),
          },
        });

      // 既存の変数を削除（後で再作成）
      await tx
        .delete(customerVariables)
        .where(eq(customerVariables.customerId, customer.customerId));

      // 変数を保存
      const variables = customer.getAllVariables();
      if (variables.length > 0) {
        await tx.insert(customerVariables).values(
          variables.map((v) => ({
            id: v.id,
            customerId: v.customerId,
            key: v.key,
            value: v.value,
          }))
        );
      }
    });
  }

  /**
   * 顧客をIDで検索
   */
  async findById(id: string): Promise<Customer | null> {
    // 顧客を検索
    const customerData = await db
      .select()
      .from(customers)
      .where(eq(customers.customerId, id))
      .limit(1);

    if (customerData.length === 0) {
      return null;
    }

    // 顧客の変数を検索
    const variablesData = await db
      .select()
      .from(customerVariables)
      .where(eq(customerVariables.customerId, id));

    // 変数オブジェクトを作成
    const variables = variablesData.map(
      (v) => new CustomerVariable(v.id, v.customerId, v.key, v.value || "")
    );

    // 顧客オブジェクトを作成
    return new Customer(
      customerData[0].customerId,
      customerData[0].name,
      customerData[0].phoneNumber || undefined,
      variables
    );
  }

  /**
   * 全ての顧客を取得
   */
  async findAll(): Promise<Customer[]> {
    // 全ての顧客を取得
    const customersData = await db.select().from(customers);

    // 全ての変数を取得
    const variablesData = await db.select().from(customerVariables);

    // 顧客IDごとに変数をグループ化
    const variablesByCustomerId = new Map<string, CustomerVariable[]>();

    variablesData.forEach((v) => {
      const customerId = v.customerId;
      if (!variablesByCustomerId.has(customerId)) {
        variablesByCustomerId.set(customerId, []);
      }

      variablesByCustomerId
        .get(customerId)
        ?.push(new CustomerVariable(v.id, v.customerId, v.key, v.value || ""));
    });

    // 顧客オブジェクトを作成
    return customersData.map(
      (c) =>
        new Customer(
          c.customerId,
          c.name,
          c.phoneNumber || undefined,
          variablesByCustomerId.get(c.customerId) || []
        )
    );
  }

  /**
   * 顧客を削除
   */
  async delete(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.customerId, id));
    // カスケード削除により、関連する変数も削除される
  }
}
