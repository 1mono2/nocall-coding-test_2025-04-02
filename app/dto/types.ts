/**
 * DTOの型定義ファイル
 * フロントエンドとバックエンド間で共有する型定義をここに集約します
 */

import { z } from "zod";

/**
 * 顧客変数DTO
 */
export interface CustomerVariableDTO {
	key: string;
	value: string;
}

/**
 * 顧客DTO
 */
export interface CustomerDTO {
	customerId: string;
	name: string;
	phoneNumber: string;
	variables: CustomerVariableDTO[];
}

/**
 * 通話DTO
 */
export interface CallDTO {
	callId: string;
	customerId: string;
	status: "queued" | "in-progress" | "completed" | "canceled" | "failed";
	requestedAt: string;
	startedAt?: string;
	endedAt?: string;
	durationSec?: number;
}

/**
 * Zodバリデーションスキーマ
 */
export const CustomerInputSchema = z.object({
	name: z.string().min(1, "顧客名は必須です"),
	phoneNumber: z.string().min(1, "電話番号は必須です"),
	variables: z
		.array(
			z.object({
				key: z.string(),
				value: z.string(),
			}),
		)
		.optional(),
});

export const CallInputSchema = z.object({
	customerId: z.string().min(1, "顧客IDは必須です"),
});
