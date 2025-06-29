import { a as JsonRpcResponse, J as JsonRpcRequest, R as RpcTranscoder } from './types-7fIUzIha.js';
export { B as BaseJsonRpcResponse, b as JsonRpcErrorResponse, c as JsonRpcSuccessResponse } from './types-7fIUzIha.js';

/**
 * Type guard to check if a given object is a valid JSON-RPC response.
 */
declare function isJsonRpcResponse(res: unknown): res is JsonRpcResponse;
/**
 * Interface for custom transports. Implementations are expected to serialize
 * the given request and return an object that is a JsonRpcResponse.
 */
type RpcTransport = (req: JsonRpcRequest, abortSignal: AbortSignal, onEventCallback?: (data: JsonRpcResponse & {
    result: any;
}) => void) => Promise<JsonRpcResponse>;
type ErrorFunctionType = (data: {
    code: string;
    message?: string;
    data?: any;
}) => void;
type RpcClientOptions = {
    transport: RpcTransport;
    transcoder?: RpcTranscoder<any>;
    onError?: ErrorFunctionType;
};
type Promisify<T> = T extends (...args: any[]) => Promise<any> ? T : T extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : T;
type PromisifyMethods<T extends object> = {
    [K in keyof T]: Promisify<T[K]>;
};
declare function rpcClient<T extends object>(options: RpcClientOptions): {
    /**
     * Abort the request for the given promise.
     */
    $abort: (promise: Promise<any>) => void;
} & PromisifyMethods<T>;
/**
 * Create a JsonRpcRequest for the given method.
 */
declare function createRequest(method: string, params?: any[]): JsonRpcRequest;
/**
 * Returns a shallow copy the given array without any
 * trailing `undefined` values.
 */
declare function removeTrailingUndefs(values: any[]): any[];

export { type ErrorFunctionType, JsonRpcRequest, JsonRpcResponse, RpcTranscoder, type RpcTransport, createRequest, isJsonRpcResponse, removeTrailingUndefs, rpcClient };
