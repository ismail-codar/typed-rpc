import type {
  JsonRpcErrorResponse,
  JsonRpcRequest,
  JsonRpcResponse,
  RpcTranscoder,
} from "./types.js";

export * from "./types.js";

/**
 * Type guard to check if a given object is a valid JSON-RPC response.
 */
export function isJsonRpcResponse(res: unknown): res is JsonRpcResponse {
  if (typeof res !== "object" || res === null) return false;
  if (!("jsonrpc" in res) || res.jsonrpc !== "2.0") return false;
  if (
    !("id" in res) ||
    (typeof res.id !== "string" &&
      typeof res.id !== "number" &&
      res.id !== null)
  )
    return false;

  if ("result" in res) {
    // Check for JsonRpcSuccessResponse
    return !("error" in res);
  } else if ("error" in res) {
    // Check for JsonRpcErrorResponse
    const error = (res as JsonRpcErrorResponse).error;
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "number" &&
      "message" in error &&
      typeof error.message === "string"
    );
  }

  return false;
}

/**
 * Error class that is thrown if a remote method returns an error.
 */
export class RpcError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.data = data;
    // https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
    Object.setPrototypeOf(this, RpcError.prototype);
  }
}

/**
 * Interface for custom transports. Implementations are expected to serialize
 * the given request and return an object that is a JsonRpcResponse.
 */
export type RpcTransport = (
  req: JsonRpcRequest,
  abortSignal: AbortSignal,
  onEventCallback?: (data: JsonRpcResponse & { result: any }) => void
) => Promise<JsonRpcResponse>;

type RpcClientOptions = {
  transport: RpcTransport;
  transcoder?: RpcTranscoder<any>;
};

type Promisify<T> = T extends (...args: any[]) => Promise<any>
  ? T // already a promise
  : T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : T; // not a function;

type PromisifyMethods<T extends object> = {
  [K in keyof T]: Promisify<T[K]>;
};

const identityTranscoder: RpcTranscoder<any> = {
  serialize: (data) => data,
  deserialize: (data) => data,
};

export function rpcClient<T extends object>(options: RpcClientOptions) {
  const transport = options.transport;
  const { serialize, deserialize } = options.transcoder || identityTranscoder;

  /**
   * Send a request using the configured transport and handle the result.
   */
  const sendRequest = async (
    method: string,
    args: any[],
    signal: AbortSignal
  ) => {
    const rpcEventCallbacks: Function[] = [];
    if (method === "events.on") {
      rpcEventCallbacks.push(args[1]);
      args[1] = { $cb_fn: rpcEventCallbacks.length - 1 };
    }
    const req = createRequest(method, args);
    const raw = await transport(serialize(req as any), signal, (cbData) => {
      const fn = rpcEventCallbacks[cbData.result.$cb_fn];
      fn.call(null, ...cbData.result.args);
    });
    const res = deserialize(raw);
    if ("result" in res) {
      return res.result;
    } else if ("error" in res) {
      const { code, message, data } = res.error;
      throw new RpcError(message, code, data);
    }
    throw new TypeError("Invalid response");
  };

  // Map of AbortControllers to abort pending requests
  const abortControllers = new WeakMap<Promise<any>, AbortController>();

  const target = {
    /**
     * Abort the request for the given promise.
     */
    $abort: (promise: Promise<any>) => {
      const ac = abortControllers.get(promise);
      ac?.abort();
    },
  };

  function ClientProxy(path: string) {
    return new Proxy(() => {}, {
      get: function (_, prop) {
        return ClientProxy(`${path ? `${path}.` : ""}${String(prop)}`);
      },
      apply: function (_, __, args) {
        const ac = new AbortController();
        const promise = sendRequest(path.toString(), args, ac.signal);
        abortControllers.set(promise, ac);
        promise
          .finally(() => {
            abortControllers.delete(promise);
          })
          .catch(() => {});
        return promise;
      },
    }) as any as typeof target & PromisifyMethods<T>;
  }

  return ClientProxy("");
}

/**
 * Create a JsonRpcRequest for the given method.
 */
export function createRequest(method: string, params?: any[]): JsonRpcRequest {
  const req: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
  };

  if (params?.length) {
    req.params = removeTrailingUndefs(params);
  }

  return req;
}

/**
 * Returns a shallow copy the given array without any
 * trailing `undefined` values.
 */
export function removeTrailingUndefs(values: any[]) {
  const a = [...values];
  while (a.length && a[a.length - 1] === undefined) a.length--;
  return a;
}
