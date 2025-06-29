import { isJsonRpcResponse } from '../client.mjs';

function websocketTransport(options) {
  const pendingResponses = /* @__PURE__ */ new Map();
  const timeout = options.timeout ?? 6e4;
  let wsPromise;
  function connect() {
    wsPromise = new Promise((resolve, reject) => {
      const ws = new WebSocket(options.url);
      ws.addEventListener("open", (ev) => {
        options.onOpen?.(ev, ws);
        resolve(ws);
      });
      ws.addEventListener(
        "error",
        (ev) => {
          ws.close();
          reject(ev.error);
        },
        { once: true }
      );
      ws.addEventListener("message", (ev) => {
        let res;
        try {
          res = JSON.parse(ev.data.toString());
        } catch (err) {
          options.onMessageError?.(err);
          return;
        }
        if (!isJsonRpcResponse(res)) {
          options.onMessageError?.(new TypeError("Invalid response"));
          return;
        }
        if (res.id === null) {
          return;
        }
        const pending = pendingResponses.get(res.id);
        if (!pending) {
          options.onMessageError?.(
            new Error("Request not found for id: " + res.id)
          );
          return;
        }
        pendingResponses.delete(res.id);
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        pending.resolve(res);
      });
      ws.addEventListener("close", (ev) => {
        const reconnectTimeout = options.reconnectTimeout ?? 1e3;
        if (reconnectTimeout !== 0 && (!ev.wasClean || ev.reason === "reconnect")) {
          setTimeout(connect, reconnectTimeout);
        }
      });
    });
  }
  connect();
  return (req, signal) => {
    const requestId = req.id ?? -1;
    return new Promise((resolve, reject) => {
      const pending = { resolve, reject };
      if (timeout > 0) {
        pending.timeoutId = setTimeout(() => {
          reject(new Error("Request timed out", { cause: -32e3 }));
        }, timeout);
      }
      signal.onabort = () => {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        reject(new Error("Request aborted", { cause: -32e3 }));
      };
      pendingResponses.set(requestId, pending);
      wsPromise.then((ws) => {
        ws.send(JSON.stringify(req));
      }).catch((err) => {
        pendingResponses.delete(requestId);
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        reject(err);
      });
    });
  };
}

export { websocketTransport };
//# sourceMappingURL=ws.mjs.map
