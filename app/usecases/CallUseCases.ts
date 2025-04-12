import { Call } from "../models/Call";
import type { ICallRepository } from "../repositories/ICallRepository";
import type { ICustomerRepository } from "../repositories/ICustomerRepository";

/**
 * コール予約ユースケース
 */
export class RequestCallUseCase {
	constructor(
		private callRepo: ICallRepository,
		private customerRepo: ICustomerRepository,
	) {}

	public async execute(input: {
		customerId: string;
		requestedAt?: Date;
	}): Promise<string | null> {
		// 顧客が存在するか確認
		const customer = await this.customerRepo.findById(input.customerId);
		if (!customer) {
			return null; // 顧客が存在しない場合はnullを返す
		}

		// コールを作成
		const call = Call.create(input.customerId, input.requestedAt || new Date());

		await this.callRepo.save(call);
		return call.callId;
	}
}

/**
 * コール開始ユースケース
 */
export class StartCallUseCase {
	constructor(private callRepo: ICallRepository) {}

	public async execute(callId: string): Promise<boolean> {
		const call = await this.callRepo.findById(callId);

		if (!call) {
			return false;
		}

		try {
			call.startCall();
			await this.callRepo.save(call);
			return true;
		} catch (error) {
			console.error("コール開始エラー:", error);
			return false;
		}
	}
}

/**
 * コール完了ユースケース
 */
export class CompleteCallUseCase {
	constructor(private callRepo: ICallRepository) {}

	public async execute(callId: string): Promise<boolean> {
		const call = await this.callRepo.findById(callId);

		if (!call) {
			return false;
		}

		try {
			call.completeCall();
			await this.callRepo.save(call);
			return true;
		} catch (error) {
			console.error("コール完了エラー:", error);
			return false;
		}
	}
}

/**
 * コールキャンセルユースケース
 */
export class CancelCallUseCase {
	constructor(private callRepo: ICallRepository) {}

	public async execute(callId: string): Promise<boolean> {
		const call = await this.callRepo.findById(callId);

		if (!call) {
			return false;
		}

		try {
			call.cancelCall();
			await this.callRepo.save(call);
			return true;
		} catch (error) {
			console.error("コールキャンセルエラー:", error);
			return false;
		}
	}
}

/**
 * コール詳細取得ユースケース
 */
export class GetCallUseCase {
	constructor(private callRepo: ICallRepository) {}

	public async execute(callId: string): Promise<Call | null> {
		return this.callRepo.findById(callId);
	}
}

/**
 * 顧客IDに基づくコール一覧取得ユースケース
 */
export class GetCallsByCustomerUseCase {
	constructor(private callRepo: ICallRepository) {}

	public async execute(customerId: string): Promise<Call[]> {
		return this.callRepo.findAllByCustomerId(customerId);
	}
}

/**
 * すべてのコール取得ユースケース
 */
export class GetAllCallsUseCase {
	constructor(private callRepo: ICallRepository) {}

	public async execute(): Promise<Call[]> {
		return this.callRepo.findAll();
	}
}
