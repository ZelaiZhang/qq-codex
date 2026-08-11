import type { BrowserWindow, IpcMain } from "electron";
import { dialog } from "electron";
import { z } from "zod";
import { channels } from "../src/shared/channels";
import {
  approvalResponseSchema,
  createTaskSchema,
  listWorkspaceFilesSchema,
  renameTaskSchema,
  resumeTaskSchema,
  sendMessageSchema,
  stopTurnSchema,
} from "../src/shared/ipcSchemas";
import type { DesktopController } from "../src/main/DesktopController";
import { listWorkspaceEntries } from "../src/main/workspaces/listWorkspaceEntries";

const listTasksSchema = z.object({ workspaceId: z.string().trim().min(1).optional() });

export function registerIpc(
  ipcMain: IpcMain,
  window: BrowserWindow,
  controller: DesktopController,
): () => void {
  type InvokeHandler = Parameters<IpcMain["handle"]>[1];
  const handles: string[] = [];
  const handle = (channel: string, listener: InvokeHandler) => {
    ipcMain.handle(channel, listener);
    handles.push(channel);
  };

  handle(channels.chooseWorkspace, async () => {
    const result = await dialog.showOpenDialog(window, { properties: ["openDirectory"] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
  handle(channels.listWorkspaces, () => controller.listWorkspaces());
  handle(channels.listTasks, (_event, payload) => {
    const { workspaceId } = listTasksSchema.parse(payload ?? {});
    return controller.listTasks(workspaceId);
  });
  handle(channels.createTask, (_event, payload) => controller.createTask(createTaskSchema.parse(payload).cwd));
  handle(channels.resumeTask, (_event, payload) => controller.resumeTask(resumeTaskSchema.parse(payload).taskId));
  handle(channels.renameTask, (_event, payload) => {
    const input = renameTaskSchema.parse(payload);
    return controller.renameTask(input.taskId, input.title);
  });
  handle(channels.sendMessage, (_event, payload) => {
    const input = sendMessageSchema.parse(payload);
    return controller.sendMessage(input.taskId, input.prompt);
  });
  handle(channels.stopTurn, (_event, payload) => controller.stopTurn(stopTurnSchema.parse(payload).taskId));
  handle(channels.respondToApproval, (_event, payload) => {
    const input = approvalResponseSchema.parse(payload);
    return controller.respondToApproval(input.requestId, input.decision);
  });
  handle(channels.listWorkspaceFiles, (_event, payload) =>
    listWorkspaceEntries(listWorkspaceFilesSchema.parse(payload).cwd));
  handle(channels.minimizeWindow, () => window.minimize());
  handle(channels.toggleMaximizeWindow, () => window.isMaximized() ? window.unmaximize() : window.maximize());
  handle(channels.closeWindow, () => window.close());

  const unsubscribe = controller.onEvent((event) => {
    if (!window.isDestroyed()) window.webContents.send(channels.sessionEvent, event);
  });
  return () => {
    unsubscribe();
    for (const channel of handles) ipcMain.removeHandler(channel);
  };
}
