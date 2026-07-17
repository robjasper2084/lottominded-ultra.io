import { createGameServer } from "../scripts/serve.mjs";

export default async function globalSetup() {
  const server = createGameServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(4178, "127.0.0.1", resolve);
  });

  return async () => {
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  };
}
