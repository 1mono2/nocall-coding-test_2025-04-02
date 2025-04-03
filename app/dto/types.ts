/**
 * DTOの型定義ファイル
 * フロントエンドとバックエンド間で共有する型定義をここに集約します
 */

import { z } from 'zod';

/**
 * 顧客変数DTO
 */
export interface CustomerVariableDTO {
  id: string;
  customerId: string;
  key: string;
  value: string;
}

/**
 * 顧客DTO
 */
export interface CustomerDTO {
  customerId: string;
  name: string;
  phoneNumber?: string;
  variables: CustomerVariableDTO[];
}

/**
 * 顧客作成・更新用DTO
 */
export interface CustomerInputDTO {
  name: string;
  phoneNumber?: string;
  variables?: Record<string, string>;
}

/**
 * 通話DTO
 */
export interface CallDTO {
  callId: string;
  customerId: string;
  status: 'queued' | 'in-progress' | 'completed' | 'canceled' | 'failed';
  requestedAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
}

/**
 * 通話作成用DTO
 */
export interface CallInputDTO {
  customerId: string;
}

/**
 * API共通レスポンス型
 */
export interface ApiResponse<T> {
  message: string;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Zodバリデーションスキーマ
 */
export const CustomerInputSchema = z.object({
  name: z.string().min(1, "顧客名は必須です"),
  phoneNumber: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export const CallInputSchema = z.object({
  customerId: z.string().min(1, "顧客IDは必須です")
});
