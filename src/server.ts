import type {
  JsonRpcRequest,
  JsonRpcErrorResponse,
  JsonRpcSuccessResponse,
  RpcTranscoder,
  JsonRpcResponse,
} from "./types.js";

export * from "./types.js";

/**
 * Type guard to check if a given object is a valid JSON-RPC request.
 */
export function isJsonRpcRequest(req: any): req is JsonRpcRequest {
  if (req.jsonrpc !== "2.0") return false;
  if (typeof req.method !== "string") return false;
  if (!Array.isArray(req.params) && req.params !== undefined) return false;
  return true;
}

/**
 * Type guard to check if an object has a certain property.
 */
function hasProperty<T, P extends string>(
  obj: T,
  prop: P
): obj is T & Record<P, unknown> {
  return typeof obj === "object" && obj !== null && prop in obj;
}

/**
 * Type guard to check if an object has a certain method.
 */
function hasMethod<T, P extends string>(
  obj: T,
  prop: P
): obj is T & Record<P, (...params: any[]) => any> {
  return hasProperty(obj, prop) && typeof obj[prop] === "function";
}

function getErrorCode(err: unknown) {
  if (hasProperty(err, "code") && typeof err.code === "number") {
    return err.code;
  }
  return -32000;
}

function getErrorMessage(err: unknown) {
  if (hasProperty(err, "message") && typeof err.message === "string") {
    return err.message;
  }
  return "";
}

function getErrorData(err: unknown) {
  if (hasProperty(err, "data")) {
    const stringifiedData = JSON.stringify(err.data);
    if (stringifiedData !== undefined) {
      err.data = JSON.parse(stringifiedData);
    }
    return err.data;
  }
}

/**
 * Returns the id or null if there is no valid id.
 */
function getRequestId(req: unknown) {
  if (hasProperty(req, "id")) {
    const id = req.id;
    if (typeof id === "string" || typeof id === "number") return id;
  }
  return null;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Signature that all RPC methods must adhere to.
 */
export type RpcMethod<V = JsonValue> = (...args: any[]) => V | Promise<V>;

/**
 * Conditional type to verify a given type is a valid RPC method.
 */
type ValidMethod<T, V> = T extends RpcMethod<V> ? T : never;

/**
 * Conditional type to verify that a function is also a valid RPC method.
 */
type RpcServiceProp<T, V> = T extends (...args: any) => any
  ? ValidMethod<T, V>
  : T;

/**
 * Type for RPC services that makes sure that all return values can
 * be serialized.
 */
export type RpcService<T, V> = { [K in keyof T]: RpcServiceProp<T[K], V> };

/**
 * Options to customize the behavior of the RPC handler.
 */
export type RpcHandlerOptions<V> = {
  transcoder?: RpcTranscoder<V>;
  onError?: (err: unknown) => void;
  getErrorCode?: (err: unknown) => number;
  getErrorMessage?: (err: unknown) => string;
  getErrorData?: (err: unknown) => unknown;
  onEventEmit?: (data: JsonRpcResponse & { method: string }) => void;
};

function traverseJson(
  jsonObj: any,
  callback: (parent: any, key: string) => void
) {
  // Stack yapısı
  const stack: any[] = [];

  // Ana JSON objesi başlangıçta stack'e eklenir
  stack.push({ parent: null, key: null, value: jsonObj });

  // Stack boş olana kadar devam et
  while (stack.length > 0) {
    const current = stack.pop(); // Stack'ten en üstteki elemanı al
    const { parent, key, value } = current; // Parent, key ve value'yu çıkar

    // Callback'i çağır (ebeveyn obje ve anahtar için)
    if (parent && key) callback(parent, key);

    // Eğer obje veya dizi değilse (terminal bir düğüm) devam etme
    if (typeof value !== "object" || value === null) {
      continue;
    }

    // Obje veya dizinin her bir anahtarını işle
    for (const childKey in value) {
      if (value.hasOwnProperty(childKey)) {
        stack.push({ parent: value, key: childKey, value: value[childKey] }); // Alt objeyi stack'e ekle
      }
    }
  }
}
const isoDateRegex =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|([+-](0[0-9]|1[0-3]):[0-5]\d))?)?$/;
const isoDateLengths = [10, 20, 24, 29];
const isIsoDate = (value: any) => {
  return (
    typeof value === "string" &&
    isoDateLengths.includes(value.length) &&
    isoDateRegex.test(value)
  );
};

export async function handleRpc<T extends RpcService<T, V>, V = JsonValue>(
  request: JsonRpcRequest,
  service: T,
  options?: RpcHandlerOptions<V>
): Promise<JsonRpcErrorResponse | JsonRpcSuccessResponse> {
  const cb_fn = request.params?.[1];
  if (
    request.method === "events.on" &&
    request.params &&
    options?.onEventEmit
  ) {
    request.params[1] = (...args: any[]) => {
      cb_fn.args = args;
      options.onEventEmit?.({
        jsonrpc: request.jsonrpc,
        result: cb_fn,
        id: request.id,
        method: request.params?.[0],
      });
      return cb_fn;
    };
  }
  const req = options?.transcoder?.deserialize(request) ?? request;
  const id = getRequestId(req);
  const res = (data: any) => {
    const raw = {
      jsonrpc: "2.0",
      id,
      ...data,
    };
    return options?.transcoder?.serialize(raw) ?? raw;
  };

  if (!isJsonRpcRequest(req)) {
    //The JSON sent is not a valid Request object
    return res({ error: { code: -32600, message: "Invalid Request" } });
  }
  const procedurePath = req.method.split(".");
  const method = procedurePath.splice(-1, 1)[0];
  for (const proc of procedurePath) {
    // @ts-ignore
    service = service[proc];
  }
  if (!hasMethod(service, method)) {
    return res({
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
  try {
    const params = req.params ?? [];
    traverseJson(params, (parent, key) => {
      console.log(key);
      if (isIsoDate(parent[key])) {
        parent[key] = new Date(parent[key]);
      }
    });
    if (req.extra) {
      params.push(req.extra);
    }
    const result = await service[method](...params);
    if (req.method === "events.on") {
      return res({ result: cb_fn });
    }
    return res({ result });
  } catch (err) {
    if (options?.onError) {
      options.onError(err);
    }
    return res({
      error: {
        code: (options?.getErrorCode ?? getErrorCode)(err),
        message: (options?.getErrorMessage ?? getErrorMessage)(err),
        data: (options?.getErrorData ?? getErrorData)(err),
      },
    });
  }
}
