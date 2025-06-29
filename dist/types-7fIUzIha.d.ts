interface JsonRpcRequest {
    jsonrpc: "2.0";
    id?: string | number | null;
    method: string;
    params?: any[];
    extra?: any;
}
interface BaseJsonRpcResponse {
    jsonrpc: "2.0";
    id?: string | number | null;
}
interface JsonRpcErrorResponse extends BaseJsonRpcResponse {
    error: {
        code: number;
        message: string;
        data?: any;
    };
}
interface JsonRpcSuccessResponse extends BaseJsonRpcResponse {
    result: any;
}
type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;
type RpcTranscoder<T> = {
    serialize: (data: T) => any;
    deserialize: (data: any) => T;
};

export type { BaseJsonRpcResponse as B, JsonRpcRequest as J, RpcTranscoder as R, JsonRpcResponse as a, JsonRpcErrorResponse as b, JsonRpcSuccessResponse as c };
