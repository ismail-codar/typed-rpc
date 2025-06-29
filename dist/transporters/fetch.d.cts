import { ErrorFunctionType, RpcTransport } from '../client.cjs';
import '../types-7fIUzIha.js';

type FetchOptions = {
    url: string;
    credentials?: RequestCredentials;
    getHeaders?(): Record<string, string> | Promise<Record<string, string>> | undefined;
    onError?: ErrorFunctionType;
    hasError?(json: any): Parameters<ErrorFunctionType>[0] | undefined;
};
/**
 * Create a RpcTransport that uses the global fetch.
 */
declare function fetchTransport(options: FetchOptions): RpcTransport;

export { type FetchOptions, fetchTransport };
