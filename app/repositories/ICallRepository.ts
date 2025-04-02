import { Call } from '../models/Call';

/**
 * コールリポジトリのインターフェース
 */
export interface ICallRepository {
  save(call: Call): Promise<void>;
  findById(callId: string): Promise<Call | null>;
  findAllByCustomerId(customerId: string): Promise<Call[]>;
  findAll(): Promise<Call[]>;
  delete(callId: string): Promise<void>;
}
