import { eq } from "drizzle-orm";
import { type DatabaseClient, db as globalDb } from "../db";
import { calls } from "../db/schema";
import { Call, CallStatus } from "../models/Call";
import type { ICallRepository } from "./ICallRepository";

/**
 * コールリポジトリの実装
 */
export class CallRepository implements ICallRepository {
	/**
	 * コンストラクタ
	 * @param db DBインスタンスまたはトランザクション、デフォルトではグローバルのDBを使用
	 */
	constructor(private db: DatabaseClient = globalDb) {}
	/**
	 * コールを保存（新規作成または更新）
	 */
	async save(call: Call): Promise<void> {
		// CallStatus enumを文字列に変換して保存する
		await this.db
			.insert(calls)
			.values({
				callId: call.callId,
				customerId: call.customerId,
				status: call.status,
				requestedAt: call.requestedAt,
				startedAt: call.startedAt || null,
				endedAt: call.endedAt || null,
				durationSec: call.durationSec || null,
			})
			.onConflictDoUpdate({
				target: calls.callId,
				set: {
					status: call.status,
					startedAt: call.startedAt || null,
					endedAt: call.endedAt || null,
					durationSec: call.durationSec || null,
					updatedAt: new Date(),
				},
			});
	}

	/**
	 * コールをIDで検索
	 */
	async findById(callId: string): Promise<Call | null> {
		const callData = await this.db
			.select()
			.from(calls)
			.where(eq(calls.callId, callId))
			.limit(1);

		if (callData.length === 0) {
			return null;
		}

		return this.mapToEntity(callData[0]);
	}

	/**
	 * 顧客IDに関連する全てのコールを取得
	 */
	async findAllByCustomerId(customerId: string): Promise<Call[]> {
		const callsData = await this.db
			.select()
			.from(calls)
			.where(eq(calls.customerId, customerId));

		return callsData.map((data) => this.mapToEntity(data));
	}

	/**
	 * 全てのコールを取得
	 */
	async findAll(): Promise<Call[]> {
		const callsData = await this.db.select().from(calls);
		return callsData.map((data) => this.mapToEntity(data));
	}

	/**
	 * コールを削除
	 */
	async delete(callId: string): Promise<void> {
		await this.db.delete(calls).where(eq(calls.callId, callId));
	}

	/**
	 * データベースの行データからCallエンティティへ変換
	 */
	private mapToEntity(data: typeof calls.$inferSelect): Call {
		return new Call(
			data.callId,
			data.customerId,
			this.statusDataMapper(data.status),
			new Date(data.requestedAt),
			data.startedAt ? new Date(data.startedAt) : undefined,
			data.endedAt ? new Date(data.endedAt) : undefined,
			data.durationSec || undefined,
		);
	}

	private statusDataMapper(status: string): CallStatus {
		switch (status) {
			case CallStatus.QUEUED:
				return CallStatus.QUEUED;
			case CallStatus.IN_PROGRESS:
				return CallStatus.IN_PROGRESS;
			case CallStatus.COMPLETED:
				return CallStatus.COMPLETED;
			case CallStatus.CANCELED:
				return CallStatus.CANCELED;
			case CallStatus.FAILED:
				return CallStatus.FAILED;
			default:
				throw new Error(`Unknown status: ${status}`);
		}
	}
}
