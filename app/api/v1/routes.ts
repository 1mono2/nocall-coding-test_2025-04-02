import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";
import { z } from "zod";
import { CustomerRepository } from "../../repositories/CustomerRepository";
import { CallRepository } from "../../repositories/CallRepository";
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

// リポジトリのインスタンスを作成
const customerRepository = new CustomerRepository();
const callRepository = new CallRepository();

// ファクトリーを作成
const factory = createFactory();

// レスポンス型の定義
type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ===== 顧客API ハンドラー =====

// 顧客作成のスキーマ
const CreateCustomerSchema = z.object({
  name: z.string().min(1, "顧客名は必須です"),
  phoneNumber: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

// 顧客作成ハンドラー
export const createCustomerHandler = factory.createHandlers(
  zValidator("json", CreateCustomerSchema),
  async (c) => {
    const input = c.req.valid("json");

    const useCase = new CreateCustomerUseCase(customerRepository);
    try {
      const customerId = await useCase.execute(input);
      return c.json<ApiResponse<{ customerId: string }>>({
        success: true,
        data: { customerId },
      });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "顧客の作成に失敗しました",
        },
        500
      );
    }
  }
);

// 顧客一覧取得ハンドラー
export const getAllCustomersHandler = factory.createHandlers(async (c) => {
  const useCase = new GetAllCustomersUseCase(customerRepository);
  try {
    const customers = await useCase.execute();
    return c.json<ApiResponse<{ customers: any[] }>>({
      success: true,
      data: { customers },
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: "顧客一覧の取得に失敗しました",
      },
      500
    );
  }
});

// 顧客取得ハンドラー
export const getCustomerHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new GetCustomerUseCase(customerRepository);
    try {
      const customer = await useCase.execute(id);

      if (!customer) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "顧客が見つかりません",
          },
          404
        );
      }

      return c.json<ApiResponse<{ customer: any }>>({
        success: true,
        data: { customer },
      });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "顧客の取得に失敗しました",
        },
        500
      );
    }
  }
);

// 顧客更新のスキーマ
const UpdateCustomerSchema = z.object({
  name: z.string().min(1, "顧客名は必須です"),
  phoneNumber: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

// 顧客更新ハンドラー
export const updateCustomerHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", UpdateCustomerSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    const useCase = new UpdateCustomerUseCase(customerRepository);
    try {
      const success = await useCase.execute({
        customerId: id,
        ...input,
      });

      if (!success) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "顧客が見つかりません",
          },
          404
        );
      }

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "顧客の更新に失敗しました",
        },
        500
      );
    }
  }
);

// 顧客削除ハンドラー
export const deleteCustomerHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new DeleteCustomerUseCase(customerRepository);
    try {
      const success = await useCase.execute(id);

      if (!success) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "顧客が見つかりません",
          },
          404
        );
      }

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "顧客の削除に失敗しました",
        },
        500
      );
    }
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
    try {
      const requestedAt = input.requestedAt
        ? new Date(input.requestedAt)
        : undefined;

      const callId = await useCase.execute({
        customerId: input.customerId,
        requestedAt,
      });

      if (!callId) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "顧客が見つかりません",
          },
          404
        );
      }

      return c.json<ApiResponse<{ callId: string }>>({
        success: true,
        data: { callId },
      });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "コールの予約に失敗しました",
        },
        500
      );
    }
  }
);

// コール一覧取得ハンドラー
export const getAllCallsHandler = factory.createHandlers(async (c) => {
  const useCase = new GetAllCallsUseCase(callRepository);
  try {
    const calls = await useCase.execute();
    return c.json<ApiResponse<{ calls: any[] }>>({
      success: true,
      data: { calls },
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: "コール一覧の取得に失敗しました",
      },
      500
    );
  }
});

// 顧客のコール一覧取得ハンドラー
export const getCustomerCallsHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new GetCallsByCustomerUseCase(callRepository);
    try {
      const calls = await useCase.execute(id);
      return c.json<ApiResponse<{ calls: any[] }>>({
        success: true,
        data: { calls },
      });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "コール一覧の取得に失敗しました",
        },
        500
      );
    }
  }
);

// コール詳細取得ハンドラー
export const getCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new GetCallUseCase(callRepository);
    try {
      const call = await useCase.execute(id);

      if (!call) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "コールが見つかりません",
          },
          404
        );
      }

      return c.json<ApiResponse<{ call: any }>>({
        success: true,
        data: { call },
      });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "コールの取得に失敗しました",
        },
        500
      );
    }
  }
);

// コール開始ハンドラー
export const startCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new StartCallUseCase(callRepository);
    try {
      const success = await useCase.execute(id);

      if (!success) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "コールの開始に失敗しました",
          },
          400
        );
      }

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "コールの開始処理に失敗しました",
        },
        500
      );
    }
  }
);

// コール完了ハンドラー
export const completeCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new CompleteCallUseCase(callRepository);
    try {
      const success = await useCase.execute(id);

      if (!success) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "コールの完了に失敗しました",
          },
          400
        );
      }

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "コールの完了処理に失敗しました",
        },
        500
      );
    }
  }
);

// コールキャンセルハンドラー
export const cancelCallHandler = factory.createHandlers(
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid("param");

    const useCase = new CancelCallUseCase(callRepository);
    try {
      const success = await useCase.execute(id);

      if (!success) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: "コールのキャンセルに失敗しました",
          },
          400
        );
      }

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "コールのキャンセル処理に失敗しました",
        },
        500
      );
    }
  }
);

// アプリケーション作成とルート定義
const app = new Hono()
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
  .post("/calls/:id/cancel", ...cancelCallHandler);

export const api = app;
export type AppType = typeof app;
