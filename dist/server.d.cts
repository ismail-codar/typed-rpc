import { J as JsonRpcRequest, R as RpcTranscoder, a as JsonRpcResponse, b as JsonRpcErrorResponse, c as JsonRpcSuccessResponse } from './types-7fIUzIha.js';
export { B as BaseJsonRpcResponse } from './types-7fIUzIha.js';

/**
 * Type guard to check if a given object is a valid JSON-RPC request.
 */
declare function isJsonRpcRequest(req: any): req is JsonRpcRequest;
type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
/**
 * Signature that all RPC methods must adhere to.
 */
type RpcMethod<V = JsonValue> = (...args: any[]) => V | Promise<V>;
/**
 * Conditional type to verify a given type is a valid RPC method.
 */
type ValidMethod<T, V> = T extends RpcMethod<V> ? T : never;
/**
 * Conditional type to verify that a function is also a valid RPC method.
 */
type RpcServiceProp<T, V> = T extends (...args: any) => any ? ValidMethod<T, V> : T;
/**
 * Type for RPC services that makes sure that all return values can
 * be serialized.
 */
type RpcService<T, V> = {
    [K in keyof T]: RpcServiceProp<T[K], V>;
};
/**
 * Options to customize the behavior of the RPC handler.
 */
type RpcHandlerOptions<V> = {
    transcoder?: RpcTranscoder<V>;
    onError?: (err: unknown) => void;
    getErrorCode?: (err: unknown) => number;
    getErrorMessage?: (err: unknown) => string;
    getErrorData?: (err: unknown) => unknown;
    onEventEmit?: (data: JsonRpcResponse & {
        method: string;
    }) => void;
};
declare function handleRpc<T extends RpcService<T, V>, V = JsonValue>(request: JsonRpcRequest, service: T, options?: RpcHandlerOptions<V>): Promise<JsonRpcErrorResponse | JsonRpcSuccessResponse>;

export { JsonRpcErrorResponse, JsonRpcRequest, JsonRpcResponse, JsonRpcSuccessResponse, type JsonValue, type RpcHandlerOptions, type RpcMethod, type RpcService, RpcTranscoder, handleRpc, isJsonRpcRequest };
