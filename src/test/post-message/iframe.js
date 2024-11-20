import { handleRpc } from "../../../dist/server.mjs";
import { rpcService } from "./rpc.js";

window.addEventListener("message", (ev) => {
  handleRpc(ev.data, rpcService)
    .then((result) => {
      window.parent.postMessage(result);
    })
    .catch((err) => {
      alert({ error: "Rpc Error: " + err.message });
    });
});
