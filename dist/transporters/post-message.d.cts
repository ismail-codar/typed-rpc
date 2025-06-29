import { RpcTransport } from '../client.cjs';
import '../types-7fIUzIha.js';

declare function postMessageTransport({ serverWindow, clientWindow, }: {
    serverWindow: Window;
    clientWindow: Window;
}): RpcTransport;

export { postMessageTransport };
