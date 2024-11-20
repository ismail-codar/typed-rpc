import type { JsonRpcRequest, RpcTransport } from "../client";

export function postMessageTransport({
  serverWindow,
  clientWindow,
}: {
  serverWindow: Window;
  clientWindow: Window;
}): RpcTransport {
  return async (req: JsonRpcRequest, signal: AbortSignal): Promise<any> => {
    serverWindow.postMessage(req, "*");

    return new Promise((resolve, reject) => {
      const callback = (ev: MessageEvent<any>) => {
        if (ev.data.id === req.id) {
          resolve(ev.data);
          clientWindow.removeEventListener("message", callback);
        }
      };
      clientWindow.addEventListener("message", callback);
    });
  };
}
