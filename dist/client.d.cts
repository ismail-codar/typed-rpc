import { J as JsonRpcRequest, a as JsonRpcResponse, R as RpcTranscoder } from './types-7fIUzIha.js';
export { B as BaseJsonRpcResponse, b as JsonRpcErrorResponse, c as JsonRpcSuccessResponse } from './types-7fIUzIha.js';

/**
 * Error class that is thrown if a remote method returns an error.
 */
declare class RpcError extends Error {
    code: number;
    data?: unknown;
    constructor(message: string, code: number, data?: unknown);
}
type RpcTransport = (req: JsonRpcRequest, abortSignal: AbortSignal, onEventCallback?: (data: JsonRpcResponse & {
    result: any;
}) => void) => Promise<JsonRpcResponse>;
type ErrorFunctionType = (data: {
    code: string;
    message?: string;
    data?: any;
}) => void;
type RpcClientOptions = {
    url?: string;
    credentials?: RequestCredentials;
    getHeaders?(): Record<string, string> | Promise<Record<string, string>> | undefined;
    transport?: RpcTransport;
    transcoder?: RpcTranscoder<any>;
};
type Promisify<T> = T extends (...args: any[]) => Promise<any> ? T : T extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : T;
type PromisifyMethods<T extends object> = {
    [K in keyof T]: Promisify<T[K]>;
};
declare function rpcClient<T extends object>(options: string | RpcClientOptions): {
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

export { type ErrorFunctionType, JsonRpcRequest, JsonRpcResponse, RpcError, RpcTranscoder, type RpcTransport, createRequest, removeTrailingUndefs, rpcClient };
