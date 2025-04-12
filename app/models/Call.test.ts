import { beforeEach, describe, expect, it } from "vitest";
import { Call, CallStatus } from "./Call";

describe("Call", () => {
	const customerId = "test-customer-id";
	let call: Call;

	beforeEach(() => {
		// 各テストケース前に新しいCallインスタンスを作成
		call = Call.create(customerId);
	});

	describe("create", () => {
		it("新しいコールを正しく作成できること", () => {
			// then
			expect(call).toBeInstanceOf(Call);
			expect(call.customerId).toBe(customerId);
			expect(call.status).toBe(CallStatus.QUEUED);
			expect(call.callId).toBeDefined();
			expect(typeof call.callId).toBe("string");
			expect(call.requestedAt).toBeInstanceOf(Date);
		});

		it("指定された日時でコールを作成できること", () => {
			// given
			const specificDate = new Date("2025-01-01T12:00:00Z");

			// when
			const callWithDate = Call.create(customerId, specificDate);

			// then
			expect(callWithDate.requestedAt).toEqual(specificDate);
		});
	});

	describe("ステータス管理", () => {
		describe("startCall", () => {
			it("QUEUEDステータスのコールを開始できること", () => {
				// when
				call.startCall();

				// then
				expect(call.status).toBe(CallStatus.IN_PROGRESS);
				expect(call.startedAt).toBeInstanceOf(Date);
			});

			it("QUEUEDステータスでないコールを開始しようとするとエラーになること", () => {
				// given
				call.startCall(); // すでに開始済み

				// then
				expect(() => call.startCall()).toThrow();
			});
		});

		describe("completeCall", () => {
			it("IN_PROGRESSステータスのコールを完了できること", () => {
				// given
				call.startCall();

				// when
				call.completeCall();

				// then
				expect(call.status).toBe(CallStatus.COMPLETED);
				expect(call.endedAt).toBeInstanceOf(Date);
				expect(call.durationSec).toBeGreaterThanOrEqual(0);
			});

			it("IN_PROGRESSステータスでないコールを完了しようとするとエラーになること", () => {
				// given
				// コールはQUEUEDステータスのまま

				// then
				expect(() => call.completeCall()).toThrow();
			});
		});

		describe("cancelCall", () => {
			it("QUEUEDステータスのコールをキャンセルできること", () => {
				// when
				call.cancelCall();

				// then
				expect(call.status).toBe(CallStatus.CANCELED);
				expect(call.endedAt).toBeInstanceOf(Date);
			});

			it("IN_PROGRESSステータスのコールをキャンセルできること", () => {
				// given
				call.startCall();

				// when
				call.cancelCall();

				// then
				expect(call.status).toBe(CallStatus.CANCELED);
				expect(call.endedAt).toBeInstanceOf(Date);
			});

			it("COMPLETED状態のコールをキャンセルしようとするとエラーになること", () => {
				// given
				call.startCall();
				call.completeCall();

				// then
				expect(() => call.cancelCall()).toThrow();
			});

			it("FAILED状態のコールをキャンセルしようとするとエラーになること", () => {
				// given
				call.startCall();
				call.failCall();

				// then
				expect(() => call.cancelCall()).toThrow();
			});
		});

		describe("failCall", () => {
			it("QUEUEDステータスのコールを失敗状態にできること", () => {
				// when
				call.failCall();

				// then
				expect(call.status).toBe(CallStatus.FAILED);
				expect(call.endedAt).toBeInstanceOf(Date);
			});

			it("IN_PROGRESSステータスのコールを失敗状態にできること", () => {
				// given
				call.startCall();

				// when
				call.failCall();

				// then
				expect(call.status).toBe(CallStatus.FAILED);
				expect(call.endedAt).toBeInstanceOf(Date);
			});

			it("COMPLETED状態のコールを失敗状態にしようとするとエラーになること", () => {
				// given
				call.startCall();
				call.completeCall();

				// then
				expect(() => call.failCall()).toThrow();
			});

			it("CANCELED状態のコールを失敗状態にしようとするとエラーになること", () => {
				// given
				call.cancelCall();

				// then
				expect(() => call.failCall()).toThrow();
			});
		});
	});

	describe("時間測定", () => {
		it("コール完了時に正しい経過時間（秒）が計算されること", async () => {
			// given
			call.startCall();

			// 少し待機して時間差を作る
			await new Promise((resolve) => setTimeout(resolve, 10));

			// when
			call.completeCall();

			// then
			expect(call.durationSec).toBeDefined();
			expect(call.durationSec).toBeGreaterThanOrEqual(0);
			expect(call.endedAt?.getTime()).toBeGreaterThan(
				call.startedAt?.getTime() || 0,
			);
		});
	});
});
