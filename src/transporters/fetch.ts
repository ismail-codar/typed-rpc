import { type ErrorFunctionType, type RpcTransport } from "../client";
import type { JsonRpcRequest } from "../types.js";

export type FetchOptions = {
  url: string;
  credentials?: RequestCredentials;
  getHeaders?():
    | Record<string, string>
    | Promise<Record<string, string>>
    | undefined;
  onError?: ErrorFunctionType;
  hasError?(json: any): Parameters<ErrorFunctionType>[0] | undefined;
};

/**
 * Create a RpcTransport that uses the global fetch.
 */
export function fetchTransport(options: FetchOptions): RpcTransport {
  return async (req: JsonRpcRequest, signal: AbortSignal): Promise<any> => {
    const headers = options?.getHeaders ? await options.getHeaders() : {};
    const res = await fetch(options.url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(req),
      credentials: options?.credentials,
      signal,
    });
    if (!res.ok) {
      if (options.onError)
        options.onError({
          code: res.status.toString(),
          message: res.statusText,
        });
      else console.error(res);
    }
    const json = await res.json();
    const error = options.hasError?.(json);
    if (error) {
      if (options.onError) options.onError(error);
      else console.error(res);
    }
    return json;
  };
}
