'use strict';

class RpcError extends Error {
  code;
  data;
  constructor(message, code, data) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, RpcError.prototype);
  }
}
const identityTranscoder = {
  serialize: (data) => data,
  deserialize: (data) => data
};
function createFetchTransport(opts) {
  return async (req, signal) => {
    const { method, ...request } = req;
    const headers = opts.getHeaders ? await opts.getHeaders() : {};
    const res = await fetch(opts.url + "/" + method, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(request),
      credentials: opts.credentials,
      signal
    });
    if (!res.ok) {
      throw new RpcError(res.statusText, res.status);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : void 0;
  };
}
function rpcClient(options) {
  const opts = typeof options === "string" ? { url: options } : options;
  const transport = opts.transport ?? createFetchTransport(opts);
  const { serialize, deserialize } = opts.transcoder || identityTranscoder;
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
    if (typeof res === "object" && res !== null && "error" in res) {
      const { code, message, data } = res.error;
      throw new RpcError(message, code, data);
    }
    return res;
  };
  const abortControllers = /* @__PURE__ */ new WeakMap();
  const target = {
    /**
     * Abort the request for the given promise.
     */
    $abort: (promise) => {
      const ac = abortControllers.get(promise);
      ac?.abort();
    }
  };
  function ClientProxy(path) {
    return new Proxy(() => {
    }, {
      get: function(_, prop) {
        if (!path && prop in target) {
          return target[prop];
        }
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

exports.RpcError = RpcError;
exports.createRequest = createRequest;
exports.removeTrailingUndefs = removeTrailingUndefs;
exports.rpcClient = rpcClient;
//# sourceMappingURL=client.cjs.map
