'use strict';

function postMessageTransport({
  serverWindow,
  clientWindow
}) {
  return async (req, signal, onEventCallback) => {
    serverWindow.postMessage(req, "*");
    return new Promise((resolve, reject) => {
      if (onEventCallback && req.method === "events.on") {
        const callback = (ev) => {
          if (ev.data.id === req.id && ev.data.method) {
            onEventCallback(ev.data);
          }
        };
        clientWindow.addEventListener("message", callback);
      } else {
        const callback = (ev) => {
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

exports.postMessageTransport = postMessageTransport;
//# sourceMappingURL=post-message.cjs.map
