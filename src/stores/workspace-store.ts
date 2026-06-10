import { create } from "zustand";
import type { Workspace } from "@/types/models";

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  workspaces: [],
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
}));
