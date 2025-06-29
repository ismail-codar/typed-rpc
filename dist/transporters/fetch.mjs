function fetchTransport(options) {
  return async (req, signal) => {
    const { method, ...request } = req;
    const headers = options?.getHeaders ? await options.getHeaders() : {};
    const res = await fetch(options.url + "/" + method, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(request),
      credentials: options?.credentials,
      signal
    });
    if (!res.ok) {
      if (options.onError)
        options.onError({
          code: res.status.toString(),
          message: res.statusText
        });
      else console.error(res);
    }
    const json = await res.json();
    const error = options.hasError?.(json);
    if (error) {
      if (options.onError) options.onError(error);
      else console.error(res);
    }
    return json;
  };
}

export { fetchTransport };
//# sourceMappingURL=fetch.mjs.map
