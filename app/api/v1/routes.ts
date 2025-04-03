import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";
import { z } from "zod";
import { CustomerRepository } from "../../repositories/CustomerRepository";
import { CallRepository } from "../../repositories/CallRepository";
import { Customer } from "../../models/Customer";
import {
  CreateCustomerUseCase,
  GetCustomerUseCase,
  GetAllCustomersUseCase,
  UpdateCustomerUseCase,
  DeleteCustomerUseCase,
} from "../../usecases/CustomerUseCases";
import {
  RequestCallUseCase,
  StartCallUseCase,
  CompleteCallUseCase,
  CancelCallUseCase,
  GetCallUseCase,
  GetCallsByCustomerUseCase,
  GetAllCallsUseCase,
} from "../../usecases/CallUseCases";
import logger from "@/lib/logger";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { CustomerInputSchema } from "../../dto/types";
import { toCustomerDTO, toCustomerDTOList } from "../../dto/mappers";

// リポジトリのインスタンスを作成
const customerRepository = new CustomerRepository();
const callRepository = new CallRepository();

// ファクトリーを作成
const factory = createFactory();

// 顧客作成のスキーマ（DTOから再利用）
const CreateCustomerSchema = CustomerInputSchema;

// 顧客作成ハンドラー
export const createCustomerHandler = factory.createHandlers(
  zValidator("json", CreateCustomerSchema),
  async (c) => {
    const input = c.req.valid("json");

    // 変数配列をRecord<string, string>形式に変換
    const variablesRecord: Record<string, string> = {};
    if (input.variables && Array.isArray(input.variables)) {
      input.variables.forEach(variable => {
        variablesRecord[variable.key] = variable.value;
      });
    }

    const useCase = new CreateCustomerUseCase(customerRepository);
    const customerId = await useCase.execute({
      ...input,
      variables: variablesRecord
    });
    return c.json({
      message: "顧客の作成に成功しました",
      customerId,
    });
  }
);

// 顧客一覧取得ハンドラー
export const getAllCustomersHandler = factory.createHandlers(async (c) => {
  const useCase = new GetAllCustomersUseCase(customerRepository);
  const customers = await useCase.execute();
  return c.json({
    message: "顧客一覧の取得に成功しました",
    customers: toCustomerDTOList(customers),
  });
});

// 顧客取得ハンドラー
export const getCustomerHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new GetCustomerUseCase(customerRepository);
    const customer = await useCase.execute(id);

    if (!customer) {
      throw new HTTPException(404, {
        message: "顧客が見つかりません",
      });
    }

    return c.json({
      message: "顧客の取得に成功しました",
      customer: toCustomerDTO(customer),
    });
  }
);

// 顧客更新のスキーマ（DTOから再利用）
const UpdateCustomerSchema = CustomerInputSchema;

// 顧客更新ハンドラー
export const updateCustomerHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", UpdateCustomerSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    // 変数配列をRecord<string, string>形式に変換
    const variablesRecord: Record<string, string> = {};
    if (input.variables && Array.isArray(input.variables)) {
      input.variables.forEach(variable => {
        variablesRecord[variable.key] = variable.value;
      });
    }

    const useCase = new UpdateCustomerUseCase(customerRepository);
    const success = await useCase.execute({
      customerId: id,
      ...input,
      variables: variablesRecord
    });

    if (!success) {
      throw new HTTPException(404, {
        message: "顧客が見つかりません",
      });
    }

    return c.json({ message: "顧客の更新に成功しました" });
  }
);

// 顧客削除ハンドラー
export const deleteCustomerHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new DeleteCustomerUseCase(customerRepository);
    const success = await useCase.execute(id);

    if (!success) {
      throw new HTTPException(404, {
        message: "顧客が見つかりません",
      });
    }

    return c.json({ message: "顧客の削除に成功しました" });
  }
);

// ===== コールAPI ハンドラー =====

// コール予約のスキーマ
const RequestCallSchema = z.object({
  customerId: z.string().uuid("顧客IDが無効です"),
  requestedAt: z.string().datetime().optional(),
});

// コール予約ハンドラー
export const requestCallHandler = factory.createHandlers(
  zValidator("json", RequestCallSchema),
  async (c) => {
    const input = c.req.valid("json");

    const useCase = new RequestCallUseCase(callRepository, customerRepository);
    const requestedAt = input.requestedAt
      ? new Date(input.requestedAt)
      : undefined;

    const callId = await useCase.execute({
      customerId: input.customerId,
      requestedAt,
    });

    if (!callId) {
      throw new HTTPException(404, {
        message: "顧客が見つかりません",
      });
    }

    return c.json({
      message: "コール予約に成功しました",
      data: { callId },
    });
  }
);

// コール一覧取得ハンドラー
export const getAllCallsHandler = factory.createHandlers(async (c) => {
  const useCase = new GetAllCallsUseCase(callRepository);
  const calls = await useCase.execute();
  return c.json({
    message: "コール一覧の取得に成功しました",
    calls,
  });
});

// 顧客のコール一覧取得ハンドラー
export const getCustomerCallsHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new GetCallsByCustomerUseCase(callRepository);

    const calls = await useCase.execute(id);
    return c.json({
      message: "コール一覧の取得に成功しました",
      calls,
    });
  }
);

// コール詳細取得ハンドラー
export const getCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new GetCallUseCase(callRepository);
    const call = await useCase.execute(id);

    if (!call) {
      throw new HTTPException(404, {
        message: "コールが見つかりません",
      });
    }

    return c.json({
      message: "コールの取得に成功しました",
      call,
    });
  }
);

// コール開始ハンドラー
export const startCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new StartCallUseCase(callRepository);
    const success = await useCase.execute(id);

    if (!success) {
      throw new HTTPException(400, {
        message: "コールの開始に失敗しました",
      });
    }

    return c.json({ message: "コールを開始しました" });
  }
);

// コール完了ハンドラー
export const completeCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new CompleteCallUseCase(callRepository);
    const success = await useCase.execute(id);

    if (!success) {
      throw new HTTPException(400, {
        message: "コールの完了に失敗しました",
      });
    }

    return c.json({ message: "コールを完了しました" });
  }
);

// コールキャンセルハンドラー
export const cancelCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new CancelCallUseCase(callRepository);
    const success = await useCase.execute(id);

    if (!success) {
      throw new HTTPException(400, {
        message: "コールのキャンセルに失敗しました",
      });
    }

    return c.json({ message: "コールをキャンセルしました" });
  }
);

// グローバルエラーハンドリング
const errorHandler = (err: any, c: Context) => {
  // ステータスコードとメッセージ初期値
  let status: ContentfulStatusCode = 500;
  let message = "Internal Server Error";

  // HTTPExceptionならステータスを取得、メッセージを上書き
  if (err instanceof HTTPException && err.status < 500) {
    status = err.status;
    message = err.message;

    return c.json(
      {
        status,
        message,
        instance: c.req.path,
      },
      status
    );
  }

  // 意図しないエラー
  logger.error(err);
  return c.json(
    {
      status,
      message,
      instance: c.req.path,
    },
    status
  );
};

// アプリケーション作成とルート定義
const app = new Hono()
  .basePath("/api/v1")
  .get("/health", (c) => c.json({ message: "API is running" }, 200))
  .get("/error", (c) => {
    throw new HTTPException(400, { message: "Internal Server Error" });
  })
  // 顧客関連ルート
  .post("/customers", ...createCustomerHandler)
  .get("/customers", ...getAllCustomersHandler)
  .get("/customers/:id", ...getCustomerHandler)
  .put("/customers/:id", ...updateCustomerHandler)
  .delete("/customers/:id", ...deleteCustomerHandler)

  // コール関連ルート
  .post("/calls", ...requestCallHandler)
  .get("/calls", ...getAllCallsHandler)
  .get("/customers/:id/calls", ...getCustomerCallsHandler)
  .get("/calls/:id", ...getCallHandler)
  .post("/calls/:id/start", ...startCallHandler)
  .post("/calls/:id/complete", ...completeCallHandler)
  .post("/calls/:id/cancel", ...cancelCallHandler)
  .onError(errorHandler);

export const api = app;
export type AppType = typeof app;
