import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { DesktopApi, TaskSummary, Workspace, WorkspaceEntry } from "../../domain/types";
import { initialSession, sessionReducer } from "../../domain/sessionReducer";

export function useCodexClient(api: DesktopApi) {
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [files, setFiles] = useState<WorkspaceEntry[]>([]);
  const activeTurnId = useRef<string | null>(null);
  activeTurnId.current = session.activeTurnId;

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const reportError = useCallback((error: unknown) => {
    dispatch({
      type: "turn.failed",
      turnId: activeTurnId.current ?? "client",
      message: error instanceof Error ? error.message : "桌面客户端操作失败",
    });
    dispatch({ type: "connection.changed", connection: "error" });
  }, []);

  useEffect(() => api.onSessionEvent(dispatch), [api]);

  useEffect(() => {
    let cancelled = false;
    void api.listWorkspaces().then(async (loadedWorkspaces) => {
      if (cancelled) return;
      setWorkspaces(loadedWorkspaces);
      const firstWorkspace = loadedWorkspaces[0] ?? null;
      setSelectedWorkspaceId(firstWorkspace?.id ?? null);
      const loadedTasks = await api.listTasks(firstWorkspace?.id);
      if (cancelled) return;
      setTasks(loadedTasks);
      setSelectedTaskId(loadedTasks[0]?.id ?? null);
      dispatch({ type: "connection.changed", connection: "online" });
    }).catch(reportError);
    return () => { cancelled = true; };
  }, [api, reportError]);

  useEffect(() => {
    if (!selectedWorkspace) {
      setFiles([]);
      return;
    }
    void api.listWorkspaceFiles(selectedWorkspace.path).then(setFiles).catch(reportError);
  }, [api, reportError, selectedWorkspace]);

  const selectWorkspace = useCallback(async (workspace: Workspace) => {
    setSelectedWorkspaceId(workspace.id);
    const loadedTasks = await api.listTasks(workspace.id);
    setTasks(loadedTasks);
    setSelectedTaskId(loadedTasks[0]?.id ?? null);
  }, [api]);

  const selectTask = useCallback(async (task: TaskSummary) => {
    setSelectedTaskId(task.id);
    try {
      await api.resumeTask(task.id);
    } catch (error) {
      reportError(error);
    }
  }, [api, reportError]);

  const createTask = useCallback(async (cwd?: string) => {
    try {
      const path = cwd ?? selectedWorkspace?.path ?? await api.chooseWorkspace();
      if (!path) return;
      const task = await api.createTask(path);
      const loadedWorkspaces = await api.listWorkspaces();
      setWorkspaces(loadedWorkspaces);
      const workspace = loadedWorkspaces.find((item) => item.id === task.workspaceId) ?? loadedWorkspaces[0];
      if (workspace) setSelectedWorkspaceId(workspace.id);
      const loadedTasks = await api.listTasks(task.workspaceId);
      setTasks(loadedTasks);
      setSelectedTaskId(task.id);
    } catch (error) {
      reportError(error);
    }
  }, [api, reportError, selectedWorkspace?.path]);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!selectedTaskId) return;
    try {
      await api.sendMessage(selectedTaskId, prompt);
    } catch (error) {
      reportError(error);
    }
  }, [api, reportError, selectedTaskId]);

  const stopTurn = useCallback(async () => {
    if (!selectedTaskId) return;
    try {
      await api.stopTurn(selectedTaskId);
    } catch (error) {
      reportError(error);
    }
  }, [api, reportError, selectedTaskId]);

  const respondToApproval = useCallback(async (
    approvalId: string,
    requestId: string | number,
    decision: "accept" | "decline",
  ) => {
    try {
      await api.respondToApproval(requestId, decision);
      dispatch({ type: "approval.resolved", approvalId, decision });
    } catch (error) {
      reportError(error);
    }
  }, [api, reportError]);

  return {
    session,
    workspaces,
    tasks,
    files,
    selectedWorkspace,
    selectedTask,
    selectWorkspace,
    selectTask,
    createTask,
    sendMessage,
    stopTurn,
    respondToApproval,
  };
}
