// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AppServerCodexGateway } from "../../src/main/codex/AppServerCodexGateway";
import { AppServerTransport } from "../../src/main/codex/AppServerTransport";

describe("AppServerTransport", () => {
  it("initializes the bundled Codex App Server", async () => {
    const transport = await AppServerTransport.start();
    const gateway = new AppServerCodexGateway(transport);

    await expect(gateway.initialize()).resolves.toBeUndefined();
    await gateway.dispose();
  }, 20_000);
});
