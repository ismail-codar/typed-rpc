import { RpcTransport } from '../client.cjs';
import '../types-Dpasj_E9.js';

declare function postMessageTransport({ serverWindow, clientWindow, }: {
    serverWindow: Window;
    clientWindow: Window;
}): RpcTransport;

export { postMessageTransport };
