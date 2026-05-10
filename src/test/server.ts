import express from "express";
import { serialize, deserialize } from "superjson";

import { handleRpc } from "../server.js";
import { service } from "./service.js";
import { RequestAwareService } from "./RequestAwareService.js";
import { complexService } from "./complexService.js";

const app = express();

app.use(express.json());

app.use("/api", (req, res, next) => {
  const status = req.header("Prefer-Status");
  if (status) res.status(parseInt(status)).end();
  else next();
});

app.post("/api/:method", (req, res, next) => {
  handleRpc({ ...req.body, method: req.params.method }, service)
    .then((result) => res.json(result))
    .catch(next);
});

app.post("/request-aware-api/:method", (req, res, next) => {
  handleRpc(
    { ...req.body, method: req.params.method },
    new RequestAwareService(req.headers)
  )
    .then((result) => res.json(result))
    .catch(next);
});

app.post("/error-masked-api/:method", (req, res, next) => {
  handleRpc({ ...req.body, method: req.params.method }, service, {
    getErrorMessage: (error: unknown) => "Something went wrong",
    getErrorCode: (error: unknown) => 100,
  })
    .then((result) => res.json(result))
    .catch(next);
});

app.post("/complex-api/:method", (req, res, next) => {
  handleRpc({ ...req.body, method: req.params.method }, complexService, {
    transcoder: { serialize, deserialize },
    getErrorMessage: (error: unknown) => "Something went wrong",
    getErrorCode: (error: unknown) => 100,
  })
    .then((result) => res.json(result))
    .catch(next);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server listening on http://localhost:%s", port);
});
