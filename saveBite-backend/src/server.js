import "dotenv/config";

import { env } from "./config/env.js";
import app from "./app.js";

const port = env.port;

app.listen(port, () => {
  console.log(`SaveBite API listening on port ${port}`);
});
