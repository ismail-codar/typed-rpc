import type { JsonRpcRequest, RpcTransport } from "../client";

export function postMessageTransport({
  serverWindow,
  clientWindow,
}: {
  serverWindow: Window;
  clientWindow: Window;
}): RpcTransport {
  return async (
    req: JsonRpcRequest,
    signal: AbortSignal,
    onEventCallback?: any
  ): Promise<any> => {
    serverWindow.postMessage(req, "*");

    return new Promise((resolve, reject) => {
      if (onEventCallback && req.method === "events.on") {
        const callback = (ev: any) => {
          if (ev.data.id === req.id && ev.data.method) {
            onEventCallback(ev.data);
            // TODO evens.off removeEventListener
            // clientWindow.removeEventListener("message", callback);
          }
        };
        clientWindow.addEventListener("message", callback);
      } else {
        const callback = (ev: MessageEvent<any>) => {
          if (ev.data.id === req.id) {
            resolve(ev.data);
            clientWindow.removeEventListener("message", callback);
          }
        };
        clientWindow.addEventListener("message", callback);
      }
    });
  };
}
