import { RpcTransport } from '../client.mjs';
import '../types-7fIUzIha.js';

type WebSocketTransportOptions = {
    /**
     * The URL to connect to.
     */
    url: string;
    /**
     * Reconnection timeout in milliseconds. Default is 1000ms.
     * Set to 0 to disable reconnection.
     */
    reconnectTimeout?: number;
    /**
     * The timeout in milliseconds for requests.
     * Default is 60_000ms.
     */
    timeout?: number;
    /**
     * Error handler for incoming messages.
     */
    onMessageError?: (err: unknown) => void;
    /**
     * WebSocket open handler.
     * Use to access the WebSocket instance.
     */
    onOpen?: (ev: Event, ws: WebSocket) => void;
};
declare function websocketTransport(options: WebSocketTransportOptions): RpcTransport;

export { type WebSocketTransportOptions, websocketTransport };
