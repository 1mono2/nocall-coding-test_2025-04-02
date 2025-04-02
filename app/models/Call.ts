import { randomUUID } from 'crypto';

/**
 * コールステータスの列挙型
 */
export enum CallStatus {
  QUEUED = "queued",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  CANCELED = "canceled",
  FAILED = "failed",
}

/**
 * コールエンティティ
 */
export class Call {
  constructor(
    public readonly callId: string,
    public readonly customerId: string,
    private _status: CallStatus,
    public readonly requestedAt: Date,
    public startedAt?: Date,
    public endedAt?: Date,
    public durationSec?: number
  ) {}

  /**
   * 新しいコールインスタンスを作成（予約状態）
   */
  static create(customerId: string, requestedAt: Date = new Date()): Call {
    return new Call(
      randomUUID(),
      customerId,
      CallStatus.QUEUED,
      requestedAt
    );
  }

  /**
   * 現在のステータスを取得
   */
  get status(): CallStatus {
    return this._status;
  }

  /**
   * コールを開始
   */
  startCall(): void {
    if (this._status !== CallStatus.QUEUED) {
      throw new Error(`コールを開始できません。現在のステータス: ${this._status}`);
    }
    
    this._status = CallStatus.IN_PROGRESS;
    this.startedAt = new Date();
  }

  /**
   * コールを完了
   */
  completeCall(): void {
    if (this._status !== CallStatus.IN_PROGRESS) {
      throw new Error(`コールを完了できません。現在のステータス: ${this._status}`);
    }
    
    this._status = CallStatus.COMPLETED;
    this.endedAt = new Date();
    
    if (this.startedAt) {
      this.durationSec = Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
    }
  }

  /**
   * コールをキャンセル
   */
  cancelCall(): void {
    if (this._status === CallStatus.COMPLETED || this._status === CallStatus.FAILED) {
      throw new Error(`コールをキャンセルできません。現在のステータス: ${this._status}`);
    }
    
    this._status = CallStatus.CANCELED;
    this.endedAt = new Date();
  }

  /**
   * コールを失敗状態に設定
   */
  failCall(): void {
    if (this._status === CallStatus.COMPLETED || this._status === CallStatus.CANCELED) {
      throw new Error(`コールを失敗状態にできません。現在のステータス: ${this._status}`);
    }
    
    this._status = CallStatus.FAILED;
    this.endedAt = new Date();
  }
}
