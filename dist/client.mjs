function isJsonRpcResponse(res) {
  if (typeof res !== "object" || res === null) return false;
  if (!("jsonrpc" in res) || res.jsonrpc !== "2.0") return false;
  if (!("id" in res) || typeof res.id !== "string" && typeof res.id !== "number" && res.id !== null)
    return false;
  if ("result" in res) {
    return !("error" in res);
  } else if ("error" in res) {
    const error = res.error;
    return typeof error === "object" && error !== null && "code" in error && typeof error.code === "number" && "message" in error && typeof error.message === "string";
  }
  return false;
}
const identityTranscoder = {
  serialize: (data) => data,
  deserialize: (data) => data
};
function rpcClient(options) {
  const transport = options.transport;
  const { serialize, deserialize } = options.transcoder || identityTranscoder;
  const sendRequest = async (method, args, signal) => {
    const rpcEventCallbacks = [];
    if (method === "events.on") {
      rpcEventCallbacks.push(args[1]);
      args[1] = { $cb_fn: rpcEventCallbacks.length - 1 };
    }
    const req = createRequest(method, args);
    const raw = await transport(serialize(req), signal, (cbData) => {
      const fn = rpcEventCallbacks[cbData.result.$cb_fn];
      fn.call(null, ...cbData.result.args);
    });
    const res = deserialize(raw);
    if ("result" in res) {
      return res.result;
    } else if ("error" in res) {
      const { code, message, data } = res.error;
      if (options.onError) options.onError({ code, message, data });
      else console.error({ code, message, data });
    }
    if (options.onError) options.onError({ code: "INVALID_RESPONSE" });
    else console.error("INVALID_RESPONSE");
  };
  const abortControllers = /* @__PURE__ */ new WeakMap();
  function ClientProxy(path) {
    return new Proxy(() => {
    }, {
      get: function(_, prop) {
        return ClientProxy(`${path ? `${path}.` : ""}${String(prop)}`);
      },
      apply: function(_, __, args) {
        const ac = new AbortController();
        const promise = sendRequest(path.toString(), args, ac.signal);
        abortControllers.set(promise, ac);
        promise.finally(() => {
          abortControllers.delete(promise);
        }).catch(() => {
        });
        return promise;
      }
    });
  }
  return ClientProxy("");
}
function createRequest(method, params) {
  const req = {
    jsonrpc: "2.0",
    id: Date.now(),
    method
  };
  if (params?.length) {
    req.params = removeTrailingUndefs(params);
  }
  return req;
}
function removeTrailingUndefs(values) {
  const a = [...values];
  while (a.length && a[a.length - 1] === void 0) a.length--;
  return a;
}

export { createRequest, isJsonRpcResponse, removeTrailingUndefs, rpcClient };
//# sourceMappingURL=client.mjs.map
