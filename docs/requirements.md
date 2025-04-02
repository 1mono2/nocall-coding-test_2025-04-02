# 要件定義・詳細設計 (AIコール管理システム)

## 概要
- **顧客管理**: 顧客を登録・編集・削除し、顧客ごとのカスタム変数を管理する。
- **コール管理**: 予約されたAIコールのステータスを管理し、コール履歴を参照できる。

## ドメインモデル
### 1. 顧客 (Customer) 集約
- **エンティティ: `Customer`**
  - `customerId`: 一意の識別子 (UUIDなど)
  - `name`: 顧客名
  - `phoneNumber`: 電話番号 (任意)
  - `variables`: カスタム変数(「会社名」「製品名」など)のセット  
    - DDDの観点では、`Customer` 集約ルートが `variables` を管理し、変更時は集約ごと保存する。

- **値オブジェクト/サブエンティティ: `CustomerVariable`**  
  - 顧客が持つ動的なキー・バリュー型の変数  
  - `Customer` として1つの集約を形成する。

- **レポジトリ (インターフェース): `ICustomerRepository`**
  ```ts
  export interface ICustomerRepository {
    save(customer: Customer): Promise<void>;
    findById(id: string): Promise<Customer | null>;
    delete(id: string): Promise<void>;
    // ...
  }

### 2. コール (Call) 集約
- **エンティティ: `Call`**
  - `callId`: 一意の識別子
  - `customerId`: 呼び出し対象の顧客を参照 (IDのみ保持し、他集約を直接参照しない)
  - `status`: コールステータス (後述の CallStatus enum)
  - `requestedAt`: コール予約日時
  - `startedAt, endedAt, durationSec`: 通話の開始/終了時刻、通話時間 (必要に応じて)

- **列挙型: `CallStatus`**
  ```ts
  export enum CallStatus {
    QUEUED = "queued",
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed",
    CANCELED = "canceled",
    FAILED = "failed",
  }

- **レポジトリ (インターフェース): `ICallRepository`**
  ```ts
  export interface ICallRepository {
    save(call: Call): Promise<void>;
    findById(callId: string): Promise<Call | null>;
    findAllByCustomerId(customerId: string): Promise<Call[]>;
    // ...
  }
  ```

### 3. 集約間の関係
- **Customer 集約と Call 集約は独立した境界づけられたコンテキスト**
  - Call 側は customerId を保持しているだけで、顧客の詳細には直接アクセスしない (疎結合)。
  - 各々の集約は専用のレポジトリを介して永続化を行う。

### 4. アプリケーションサービス (UseCase) 例
- 顧客作成 (CreateCustomerUseCase)
```ts
export class CreateCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  public async execute(input: {
    name: string;
    phoneNumber?: string;
    variables?: Record<string, string>;
  }): Promise<void> {
    const customer = new Customer(/* ... */);
    // 変数設定
    // customer.setVariables(input.variables);
    await this.customerRepo.save(customer);
  }
}
```
- コール予約 (RequestCallUseCase)
```ts
export class RequestCallUseCase {
  constructor(private callRepo: ICallRepository) {}

  public async execute(input: {
    customerId: string;
  }): Promise<void> {
    const call = new Call(/* generate ID */, input.customerId, CallStatus.QUEUED, new Date());
    await this.callRepo.save(call);
  }
}
```

### 5. フレームワークと使用技術
- メインフレームワーク: Next.js (APIルーターを使用したフロント・バックエンド一体型構成)
- 使用技術:
  - **Hono RPC**: RPC構成でのルーティングやエンドポイント管理
  - **Drizzle**: データベースとのやり取り (RDB: SQLite)
  - **shadcn**: UIコンポーネントライブラリ
  - **Tailwind CSS**: スタイルフレームワーク
  - **SQLite**: RDBMS
  - **Bun**: ランタイム
  - **Vitest**: テストフレームワーク