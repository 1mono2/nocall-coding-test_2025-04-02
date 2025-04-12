import { randomUUID } from "crypto";

/**
 * 顧客変数の値オブジェクト
 */
export class CustomerVariable {
	constructor(
		public readonly id: string,
		public readonly customerId: string,
		public readonly key: string,
		public readonly value: string,
	) {}

	static create(
		customerId: string,
		key: string,
		value: string,
	): CustomerVariable {
		return new CustomerVariable(randomUUID(), customerId, key, value);
	}
}

/**
 * 顧客エンティティ
 */
export class Customer {
	private _variables: Map<string, CustomerVariable> = new Map();

	constructor(
		public readonly customerId: string,
		public readonly name: string,
		public readonly phoneNumber?: string,
		variables: CustomerVariable[] = [],
	) {
		// 変数をMapに格納
		variables.forEach((variable) => {
			this._variables.set(variable.key, variable);
		});
	}

	/**
	 * 新しい顧客インスタンスを作成
	 */
	static create(name: string, phoneNumber?: string): Customer {
		return new Customer(randomUUID(), name, phoneNumber);
	}

	/**
	 * 顧客変数の取得
	 */
	getVariable(key: string): CustomerVariable | undefined {
		return this._variables.get(key);
	}

	/**
	 * 顧客変数の追加・更新
	 */
	setVariable(key: string, value: string): CustomerVariable {
		const variable = CustomerVariable.create(this.customerId, key, value);
		this._variables.set(key, variable);
		return variable;
	}

	/**
	 * 顧客変数の削除
	 */
	removeVariable(key: string): boolean {
		return this._variables.delete(key);
	}

	/**
	 * 全ての顧客変数を取得
	 */
	getAllVariables(): CustomerVariable[] {
		return Array.from(this._variables.values());
	}
}
