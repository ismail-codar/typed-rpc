'use strict';

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

exports.createRequest = createRequest;
exports.removeTrailingUndefs = removeTrailingUndefs;
exports.rpcClient = rpcClient;
//# sourceMappingURL=client.cjs.map
