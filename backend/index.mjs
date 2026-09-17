import env from "./src/config/env.mjs";
import app from "./src/app.mjs";

app.listen(env.port, () => {
  console.log(`Server is running on http://localhost:${env.port}`);
});
