import { createServer } from "node:http";
import { registerSocketServer } from "./lib/realtime/socket-server";

const dev =
  process.env.NODE_ENV === "development" ||
  process.env.npm_lifecycle_event === "dev";

const nodeEnv = process.env.NODE_ENV ?? (dev ? "development" : "production");

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  const next = (await import("next")).default;

  const app = next({
    dev,
    hostname: host,
    port,
  });

  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    void handle(req, res);
  });

  registerSocketServer(httpServer);

  httpServer.listen(port, host, () => {
    const publicHost = host === "0.0.0.0" ? "localhost" : host;

    console.log(`> Synapse ready on http://${publicHost}:${port} (${nodeEnv})`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start Synapse server:", error);
  process.exit(1);
});
