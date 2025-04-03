import { handle } from "hono/vercel";
import { api } from "../routes";

// APIのルートハンドラー
export const GET = handle(api);
export const POST = handle(api);
export const PUT = handle(api);
export const DELETE = handle(api);
