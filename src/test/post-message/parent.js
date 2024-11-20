import { rpcClient } from "../../../dist/client.mjs";
import { postMessageTransport } from "../../transporters/post-message";
// import type { RpcService } from "./rpc.js";

// const client = rpcClient<RpcService>({
const client = rpcClient({
  transport: postMessageTransport({
    clientWindow: window,
    serverWindow: document.querySelector("iframe").contentWindow,
  }),
});

window.addEventListener("load", () => {
  client.hello("world").then((result) => {
    document.querySelector("#app").innerHTML = result;
  });
});
