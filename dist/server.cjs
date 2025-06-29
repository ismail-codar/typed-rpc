'use strict';

function isJsonRpcRequest(req) {
  if (req.jsonrpc !== "2.0") return false;
  if (typeof req.method !== "string") return false;
  if (!Array.isArray(req.params) && req.params !== void 0) return false;
  return true;
}
function hasProperty(obj, prop) {
  return typeof obj === "object" && obj !== null && prop in obj;
}
function hasMethod(obj, prop) {
  return hasProperty(obj, prop) && typeof obj[prop] === "function";
}
function getErrorCode(err) {
  if (hasProperty(err, "code") && typeof err.code === "number") {
    return err.code;
  }
  return -32e3;
}
function getErrorMessage(err) {
  if (hasProperty(err, "message") && typeof err.message === "string") {
    return err.message;
  }
  return "";
}
function getErrorData(err) {
  if (hasProperty(err, "data")) {
    const stringifiedData = JSON.stringify(err.data);
    if (stringifiedData !== void 0) {
      err.data = JSON.parse(stringifiedData);
    }
    return err.data;
  }
}
function getRequestId(req) {
  if (hasProperty(req, "id")) {
    const id = req.id;
    if (typeof id === "string" || typeof id === "number") return id;
  }
  return null;
}
function traverseJson(jsonObj, callback) {
  const stack = [];
  stack.push({ parent: null, key: null, value: jsonObj });
  while (stack.length > 0) {
    const current = stack.pop();
    const { parent, key, value } = current;
    if (parent && key) callback(parent, key);
    if (typeof value !== "object" || value === null) {
      continue;
    }
    for (const childKey in value) {
      if (value.hasOwnProperty(childKey)) {
        stack.push({ parent: value, key: childKey, value: value[childKey] });
      }
    }
  }
}
const isoDateRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|([+-](0[0-9]|1[0-3]):[0-5]\d))?)?$/;
const isoDateLengths = [10, 20, 24, 29];
const isIsoDate = (value) => {
  return typeof value === "string" && isoDateLengths.includes(value.length) && isoDateRegex.test(value);
};
async function handleRpc(request, service, options) {
  const cb_fn = request.params?.[1];
  if (request.method === "events.on" && request.params && options?.onEventEmit) {
    request.params[1] = (...args) => {
      cb_fn.args = args;
      options.onEventEmit?.({
        jsonrpc: request.jsonrpc,
        result: cb_fn,
        id: request.id,
        method: request.params?.[0]
      });
      return cb_fn;
    };
  }
  const req = options?.transcoder?.deserialize(request) ?? request;
  const id = getRequestId(req);
  const res = (data) => {
    const raw = {
      jsonrpc: "2.0",
      id,
      ...data
    };
    return options?.transcoder?.serialize(raw) ?? raw;
  };
  if (!isJsonRpcRequest(req)) {
    return res({ error: { code: -32600, message: "Invalid Request" } });
  }
  const procedurePath = req.method.split(".");
  const method = procedurePath.splice(-1, 1)[0];
  for (const proc of procedurePath) {
    service = service[proc];
  }
  if (!hasMethod(service, method)) {
    return res({
      error: { code: -32601, message: `Method not found: ${method}` }
    });
  }
  try {
    const params = req.params ?? [];
    traverseJson(params, (parent, key) => {
      console.log(key);
      if (isIsoDate(parent[key])) {
        parent[key] = new Date(parent[key]);
      }
    });
    if (req.extra) {
      params.push(req.extra);
    }
    const result = await service[method](...params);
    if (req.method === "events.on") {
      return res({ result: cb_fn });
    }
    return res({ result });
  } catch (err) {
    if (options?.onError) {
      options.onError(err);
    }
    return res({
      error: {
        code: (options?.getErrorCode ?? getErrorCode)(err),
        message: (options?.getErrorMessage ?? getErrorMessage)(err),
        data: (options?.getErrorData ?? getErrorData)(err)
      }
    });
  }
}

exports.handleRpc = handleRpc;
exports.isJsonRpcRequest = isJsonRpcRequest;
//# sourceMappingURL=server.cjs.map
