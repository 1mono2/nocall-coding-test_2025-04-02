import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseClient } from "../db";
import { Call, CallStatus } from "../models/Call";
import { Customer } from "../models/Customer";
import { CallRepository } from "./CallRepository";
import { CustomerRepository } from "./CustomerRepository";
import { createTestDb } from "./test-helpers/test-db";

describe("CallRepository", () => {
	let repository: CallRepository;
	let customerRepository: CustomerRepository;
	let testCustomer: Customer;
	let testCall: Call;
	let testDb: DatabaseClient;
	const now = new Date();

	beforeEach(async () => {
		testDb = createTestDb();
		repository = new CallRepository(testDb);
		customerRepository = new CustomerRepository(testDb);

		// テスト用の顧客データを作成して保存
		testCustomer = new Customer(
			"customer-id-1",
			"テスト顧客",
			"03-1234-5678",
			[],
		);

		await customerRepository.save(testCustomer);

		// テスト用のコールデータを作成
		testCall = new Call("call-id-1", "customer-id-1", CallStatus.QUEUED, now);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("save", () => {
		it("コール情報が正しく保存されること", async () => {
			await repository.save(testCall);

			const savedCall = await repository.findById(testCall.callId);
			expect(savedCall).not.toBeNull();
			expect(savedCall?.callId).toBe(testCall.callId);
			expect(savedCall?.customerId).toBe(testCall.customerId);
			expect(savedCall?.status).toBe(CallStatus.QUEUED);
			expect(savedCall?.requestedAt.getTime()).toBeCloseTo(now.getTime(), -4);
			expect(savedCall?.startedAt).toBeUndefined();
			expect(savedCall?.endedAt).toBeUndefined();
		});

		it("開始済みのコールが正しく保存されること", async () => {
			const startedAt = new Date();
			const startedCall = new Call(
				"call-id-2",
				testCustomer.customerId, // 既に保存されている顧客IDを使用
				CallStatus.IN_PROGRESS,
				now,
				startedAt,
			);

			await repository.save(startedCall);

			const savedCall = await repository.findById(startedCall.callId);
			expect(savedCall).not.toBeNull();
			expect(savedCall?.callId).toBe(startedCall.callId);
			expect(savedCall?.status).toBe(CallStatus.IN_PROGRESS);
			expect(savedCall?.startedAt?.getTime()).toBeCloseTo(
				startedAt.getTime(),
				-4,
			);
			expect(savedCall?.endedAt).toBeUndefined();
		});

		it("完了したコールが正しく保存されること", async () => {
			const startedAt = new Date();
			const endedAt = new Date(startedAt.getTime() + 60000); // 1分後
			const completedCall = new Call(
				"call-id-3",
				testCustomer.customerId, // 既に保存されている顧客IDを使用
				CallStatus.COMPLETED,
				now,
				startedAt,
				endedAt,
				60, // 60秒間のコール
			);

			await repository.save(completedCall);

			const savedCall = await repository.findById(completedCall.callId);
			expect(savedCall).not.toBeNull();
			expect(savedCall?.callId).toBe(completedCall.callId);
			expect(savedCall?.status).toBe(CallStatus.COMPLETED);
			expect(savedCall?.startedAt?.getTime()).toBeCloseTo(
				startedAt.getTime(),
				-4,
			);
			expect(savedCall?.endedAt?.getTime()).toBeCloseTo(endedAt.getTime(), -4);
			expect(savedCall?.durationSec).toBe(60);
		});
	});

	describe("findById", () => {
		it("存在するコールIDを指定した場合、コールオブジェクトが返されること", async () => {
			await repository.save(testCall);

			const result = await repository.findById(testCall.callId);

			expect(result).not.toBeNull();
			expect(result?.callId).toBe(testCall.callId);
			expect(result?.customerId).toBe(testCall.customerId);
			expect(result?.status).toBe(testCall.status);
			expect(result?.requestedAt.getTime()).toBeCloseTo(
				testCall.requestedAt.getTime(),
				-4,
			);
			expect(result?.startedAt).toBeUndefined();
			expect(result?.endedAt).toBeUndefined();
			expect(result?.durationSec).toBeUndefined();
		});

		it("存在しないコールIDを指定した場合、nullが返されること", async () => {
			const result = await repository.findById("non-existent-id");

			expect(result).toBeNull();
		});
	});

	describe("findAllByCustomerId", () => {
		it("指定した顧客IDに関連するすべてのコールが取得できること", async () => {
			// 同じ顧客IDを持つ複数のコールを作成
			const startedAt = new Date();
			const endedAt = new Date(startedAt.getTime() + 60000);

			const call1 = new Call(
				"call-id-1",
				testCustomer.customerId,
				CallStatus.COMPLETED,
				now,
				startedAt,
				endedAt,
				60,
			);

			const call2 = new Call(
				"call-id-2",
				testCustomer.customerId,
				CallStatus.QUEUED,
				now,
			);

			// 別の顧客を作成して保存
			const customer2 = new Customer(
				"customer-id-2",
				"別の顧客",
				undefined,
				[],
			);
			await customerRepository.save(customer2);

			// 別の顧客のコール
			const call3 = new Call(
				"call-id-3",
				customer2.customerId,
				CallStatus.IN_PROGRESS,
				now,
				new Date(),
			);

			await repository.save(call1);
			await repository.save(call2);
			await repository.save(call3);

			const results = await repository.findAllByCustomerId(
				testCustomer.customerId,
			);

			expect(results.length).toBe(2);

			// IDでソートして確認
			const sortedResults = results.sort((a, b) =>
				a.callId.localeCompare(b.callId),
			);
			expect(sortedResults[0].callId).toBe("call-id-1");
			expect(sortedResults[0].status).toBe(CallStatus.COMPLETED);
			expect(sortedResults[1].callId).toBe("call-id-2");
			expect(sortedResults[1].status).toBe(CallStatus.QUEUED);
		});

		it("該当するコールがない場合、空配列が返されること", async () => {
			const results = await repository.findAllByCustomerId(
				"customer-with-no-calls",
			);

			expect(results).toEqual([]);
			expect(results.length).toBe(0);
		});
	});

	describe("findAll", () => {
		it("すべてのコールが取得できること", async () => {
			const startedAt = new Date();
			const endedAt = new Date(startedAt.getTime() + 60000);

			const call1 = new Call(
				"call-id-1",
				testCustomer.customerId,
				CallStatus.COMPLETED,
				now,
				startedAt,
				endedAt,
				60,
			);

			// 別の顧客を作成して保存
			const customer2 = new Customer(
				"customer-id-2",
				"別の顧客",
				undefined,
				[],
			);
			await customerRepository.save(customer2);

			const call2 = new Call(
				"call-id-2",
				customer2.customerId,
				CallStatus.IN_PROGRESS,
				now,
				new Date(),
			);

			await repository.save(call1);
			await repository.save(call2);

			const results = await repository.findAll();

			expect(results.length).toBe(2);

			// IDでソートして確認
			const sortedResults = results.sort((a, b) =>
				a.callId.localeCompare(b.callId),
			);
			expect(sortedResults[0].callId).toBe("call-id-1");
			expect(sortedResults[0].customerId).toBe("customer-id-1");
			expect(sortedResults[0].status).toBe(CallStatus.COMPLETED);
			expect(sortedResults[1].callId).toBe("call-id-2");
			expect(sortedResults[1].customerId).toBe("customer-id-2");
			expect(sortedResults[1].status).toBe(CallStatus.IN_PROGRESS);
		});

		it("コールが存在しない場合、空配列が返されること", async () => {
			const results = await repository.findAll();

			expect(results).toEqual([]);
			expect(results.length).toBe(0);
		});
	});

	describe("delete", () => {
		it("指定したIDのコールが削除されること", async () => {
			await repository.save(testCall);

			const beforeDelete = await repository.findById(testCall.callId);
			expect(beforeDelete).not.toBeNull();

			await repository.delete(testCall.callId);

			const afterDelete = await repository.findById(testCall.callId);
			expect(afterDelete).toBeNull();
		});
	});
});
