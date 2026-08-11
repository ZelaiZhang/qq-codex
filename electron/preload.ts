import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi, SessionEvent } from "../src/domain/types";
import { channels } from "../src/shared/channels";

const desktopApi: DesktopApi = {
  chooseWorkspace: () => ipcRenderer.invoke(channels.chooseWorkspace),
  listWorkspaces: () => ipcRenderer.invoke(channels.listWorkspaces),
  listTasks: (workspaceId) => ipcRenderer.invoke(channels.listTasks, { workspaceId }),
  createTask: (cwd) => ipcRenderer.invoke(channels.createTask, { cwd }),
  resumeTask: (taskId) => ipcRenderer.invoke(channels.resumeTask, { taskId }),
  renameTask: (taskId, title) => ipcRenderer.invoke(channels.renameTask, { taskId, title }),
  sendMessage: (taskId, prompt) => ipcRenderer.invoke(channels.sendMessage, { taskId, prompt }),
  stopTurn: (taskId) => ipcRenderer.invoke(channels.stopTurn, { taskId }),
  respondToApproval: (requestId, decision) =>
    ipcRenderer.invoke(channels.respondToApproval, { requestId, decision }),
  listWorkspaceFiles: (cwd) => ipcRenderer.invoke(channels.listWorkspaceFiles, { cwd }),
  onSessionEvent: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: SessionEvent) => listener(payload);
    ipcRenderer.on(channels.sessionEvent, handler);
    return () => ipcRenderer.removeListener(channels.sessionEvent, handler);
  },
  minimizeWindow: () => ipcRenderer.invoke(channels.minimizeWindow),
  toggleMaximizeWindow: () => ipcRenderer.invoke(channels.toggleMaximizeWindow),
  closeWindow: () => ipcRenderer.invoke(channels.closeWindow),
};

contextBridge.exposeInMainWorld("qqCodex", desktopApi);
