import { app, BrowserWindow, ipcMain } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DesktopController } from "../src/main/DesktopController";
import { AppServerCodexGateway } from "../src/main/codex/AppServerCodexGateway";
import { AppServerTransport } from "../src/main/codex/AppServerTransport";
import { WorkspaceStore } from "../src/main/workspaces/WorkspaceStore";
import { registerIpc } from "./ipc";
import { createWindowOptions } from "./windowOptions";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
let controller: DesktopController | null = null;

async function createWindow(): Promise<void> {
  const preload = join(currentDirectory, "preload.mjs");
  const window = new BrowserWindow(createWindowOptions(preload));
  const transport = await AppServerTransport.start();
  const gateway = new AppServerCodexGateway(transport);
  const store = new WorkspaceStore(join(app.getPath("userData"), "qq-codex-state.json"));
  controller = new DesktopController(gateway, store);
  registerIpc(ipcMain, window, controller);

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await window.loadFile(join(currentDirectory, "../dist/index.html"));
  }
  window.once("ready-to-show", () => window.show());
  await controller.initialize();
}

app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
}).catch((error) => {
  console.error("QQ Codex startup failed", error);
  app.quit();
});

app.on("before-quit", () => {
  if (controller) void controller.dispose();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
