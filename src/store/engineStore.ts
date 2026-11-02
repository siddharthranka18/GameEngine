import { create } from 'zustand';
import {
  BehaviorData,
  GameObjectData,
  LightData,
  LogEntry,
  LogLevel,
  MaterialData,
  PrimitiveType,
  ProjectConfig,
  ProjectData,
  SceneData,
  TransformData,
  TransformMode,
} from '../core/types';
import { ProjectManager } from '../services/projectManager';
import { SceneManager } from '../services/sceneManager';
import { StorageService } from '../services/storage';
import { generateUUID } from '../core/id';

interface EngineState {
  // Project state
  project: ProjectData | null;
  projectList: ProjectData[];
  isProjectLoading: boolean;

  // Scene state
  scene: SceneData | null;
  isSceneDirty: boolean;

  // Editor state
  selectedId: string | null;
  transformMode: TransformMode;
  isPlaying: boolean;
  logs: LogEntry[];
  activeModal: 'newProject' | 'openProject' | 'settings' | null;

  // History state (Undo/Redo)
  undoStack: SceneData[];
  redoStack: SceneData[];

  // ── Project Actions ────────────────────────────────────────────────────────
  createProject: (name: string) => Promise<boolean>;
  openProject: (id: string) => Promise<boolean>;
  saveProjectAndScene: () => Promise<boolean>;
  closeProject: () => void;
  refreshProjectList: () => Promise<void>;
  updateProjectConfig: (config: Partial<ProjectConfig>) => Promise<void>;
  exportProjectPackage: () => string | null;
  importProjectPackage: (jsonStr: string) => Promise<boolean>;

  // ── Scene Actions ──────────────────────────────────────────────────────────
  createScene: (name: string) => Promise<boolean>;
  loadScene: (sceneId: string) => Promise<boolean>;
  saveScene: () => Promise<boolean>;
  addGameObject: (type: PrimitiveType, name?: string, parentId?: string | null) => void;
  removeGameObject: (id: string) => void;
  renameGameObject: (id: string, newName: string) => void;
  updateTransform: (id: string, transform: Partial<TransformData>) => void;
  updateMaterial: (id: string, material: Partial<MaterialData>) => void;
  updateLight: (id: string, light: Partial<LightData>) => void;
  updateBehavior: (id: string, behavior: BehaviorData) => void;
  setVisibility: (id: string, visible: boolean) => void;
  reparentGameObject: (childId: string, newParentId: string | null) => boolean;

  // ── Editor Actions ─────────────────────────────────────────────────────────
  selectObject: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  togglePlay: () => void;
  addLog: (level: LogLevel, message: string, details?: string) => void;
  clearLogs: () => void;
  openModal: (modal: 'newProject' | 'openProject' | 'settings' | null) => void;
  closeModal: () => void;

  // ── Undo / Redo Actions ───────────────────────────────────────────────────
  undo: () => void;
  redo: () => void;
}

export const useEngineStore = create<EngineState>((set, get) => {
  const pushUndo = (currentScene: SceneData) => {
    const clone = JSON.parse(JSON.stringify(currentScene));
    set((state) => ({
      undoStack: [...state.undoStack.slice(-30), clone],
      redoStack: [],
      isSceneDirty: true,
    }));
  };

  return {
    project: null,
    projectList: [],
    isProjectLoading: false,

    scene: null,
    isSceneDirty: false,

    selectedId: null,
    transformMode: 'translate',
    isPlaying: false,
    logs: [
      {
        id: generateUUID(),
        timestamp: Date.now(),
        level: 'info',
        message: 'EPSTEIN ENGINE v0.3.0 initialized. Ready.',
      },
    ],
    activeModal: null,

    undoStack: [],
    redoStack: [],

    // ── Project Actions ──────────────────────────────────────────────────────

    createProject: async (name: string) => {
      set({ isProjectLoading: true });
      const res = await ProjectManager.createProject(name);
      set({ isProjectLoading: false });

      if (res.success && res.data) {
        set({
          project: res.data.project,
          scene: res.data.defaultScene,
          selectedId: res.data.defaultScene.rootObjectIds[0] || null,
          isSceneDirty: false,
          undoStack: [],
          redoStack: [],
          activeModal: null,
        });
        get().addLog('success', `Created project "${res.data.project.name}" with default scene.`);
        await get().refreshProjectList();
        return true;
      } else {
        get().addLog('error', `Failed to create project: ${res.error?.message}`);
        return false;
      }
    },

    openProject: async (id: string) => {
      set({ isProjectLoading: true });
      const res = await ProjectManager.openProject(id);
      set({ isProjectLoading: false });

      if (res.success && res.data) {
        set({
          project: res.data.project,
          scene: res.data.startupScene || null,
          selectedId: res.data.startupScene?.rootObjectIds[0] || null,
          isSceneDirty: false,
          undoStack: [],
          redoStack: [],
          activeModal: null,
        });
        get().addLog('success', `Opened project "${res.data.project.name}".`);
        return true;
      } else {
        get().addLog('error', `Failed to open project: ${res.error?.message}`);
        return false;
      }
    },

    saveProjectAndScene: async () => {
      const { project, scene } = get();
      if (!project) {
        get().addLog('warn', 'No active project to save.');
        return false;
      }

      let sceneSaved = true;
      if (scene) {
        const sRes = await SceneManager.saveScene(scene);
        sceneSaved = sRes.success;
      }

      const pRes = await ProjectManager.saveProject(project);
      if (pRes.success && sceneSaved) {
        set({ isSceneDirty: false });
        get().addLog('success', `Project "${project.name}" and scene saved to storage.`);
        await get().refreshProjectList();
        return true;
      } else {
        get().addLog('error', `Save failed: ${pRes.error?.message || 'Scene save failed'}`);
        return false;
      }
    },

    closeProject: () => {
      const { isSceneDirty } = get();
      if (isSceneDirty && typeof window !== 'undefined') {
        const confirmClose = window.confirm(
          'You have unsaved changes in your scene. Are you sure you want to close this project?'
        );
        if (!confirmClose) return;
      }
      ProjectManager.closeProject();
      set({
        project: null,
        scene: null,
        selectedId: null,
        isSceneDirty: false,
        undoStack: [],
        redoStack: [],
      });
      get().addLog('info', 'Project closed.');
    },

    refreshProjectList: async () => {
      const res = await StorageService.listProjects();
      if (res.success && res.data) {
        set({ projectList: res.data });
      }
    },

    updateProjectConfig: async (config: Partial<ProjectConfig>) => {
      const { project } = get();
      if (!project) return;
      const updated = {
        ...project,
        config: { ...project.config, ...config },
      };
      set({ project: updated });
      await StorageService.saveProject(updated);
      get().addLog('info', 'Project settings updated.');
    },

    exportProjectPackage: () => {
      const { project, scene } = get();
      if (!project) {
        get().addLog('warn', 'No active project to export.');
        return null;
      }
      const scenes = scene ? [scene] : [];
      const json = StorageService.exportProjectPackage(project, scenes);
      get().addLog('success', `Project "${project.name}" exported as JSON package.`);
      return json;
    },

    importProjectPackage: async (jsonStr: string) => {
      const res = StorageService.importProjectPackage(jsonStr);
      if (!res.success || !res.data) {
        get().addLog('error', `Import failed: ${res.error?.message}`);
        return false;
      }

      const { project, scenes } = res.data;
      await StorageService.saveProject(project);
      for (const sc of scenes) {
        await StorageService.saveScene(sc);
      }

      const startupScene = scenes.find((s) => s.id === project.startupSceneId) || scenes[0];
      set({
        project,
        scene: startupScene || null,
        selectedId: startupScene?.rootObjectIds[0] || null,
        isSceneDirty: false,
        activeModal: null,
      });
      get().addLog('success', `Imported project "${project.name}" with ${scenes.length} scene(s).`);
      await get().refreshProjectList();
      return true;
    },

    // ── Scene Actions ────────────────────────────────────────────────────────

    createScene: async (name: string) => {
      const { project } = get();
      if (!project) {
        get().addLog('warn', 'Cannot create scene: No active project.');
        return false;
      }

      const res = await SceneManager.createScene(project.id, name);
      if (res.success && res.data) {
        const newScene = res.data;
        project.sceneIds.push(newScene.id);
        await StorageService.saveProject(project);
        set({
          scene: newScene,
          selectedId: null,
          isSceneDirty: false,
          undoStack: [],
          redoStack: [],
        });
        get().addLog('success', `Created scene "${newScene.name}".`);
        return true;
      }
      return false;
    },

    loadScene: async (sceneId: string) => {
      const res = await SceneManager.loadScene(sceneId);
      if (res.success && res.data) {
        set({
          scene: res.data,
          selectedId: res.data.rootObjectIds[0] || null,
          isSceneDirty: false,
          undoStack: [],
          redoStack: [],
        });
        get().addLog('info', `Loaded scene "${res.data.name}".`);
        return true;
      }
      get().addLog('error', `Failed to load scene: ${res.error?.message}`);
      return false;
    },

    saveScene: async () => {
      const { scene } = get();
      if (!scene) return false;
      const res = await SceneManager.saveScene(scene);
      if (res.success) {
        set({ isSceneDirty: false });
        get().addLog('success', `Scene "${scene.name}" saved.`);
        return true;
      }
      return false;
    },

    addGameObject: (type: PrimitiveType, name?: string, parentId?: string | null) => {
      const { scene } = get();
      if (!scene) {
        get().addLog('warn', 'Cannot add GameObject: No active scene.');
        return;
      }
      pushUndo(scene);

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      const res = SceneManager.addGameObject(sceneClone, type, name, parentId);
      if (res.success && res.data) {
        set({
          scene: sceneClone,
          selectedId: res.data.id,
        });
        get().addLog('info', `Added ${type} "${res.data.name}" to scene.`);
      }
    },

    removeGameObject: (id: string) => {
      const { scene, selectedId } = get();
      if (!scene) return;
      pushUndo(scene);

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      const res = SceneManager.removeGameObject(sceneClone, id);
      if (res.success) {
        set({
          scene: sceneClone,
          selectedId: selectedId === id ? null : selectedId,
        });
        get().addLog('info', `Deleted GameObject (${id}).`);
      } else {
        get().addLog('error', `Delete failed: ${res.error?.message}`);
      }
    },

    renameGameObject: (id: string, newName: string) => {
      const { scene } = get();
      if (!scene) return;
      pushUndo(scene);

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      const res = SceneManager.renameGameObject(sceneClone, id, newName);
      if (res.success) {
        set({ scene: sceneClone });
      }
    },

    updateTransform: (id: string, transform: Partial<TransformData>) => {
      const { scene } = get();
      if (!scene || !scene.gameObjects[id]) return;

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      SceneManager.updateTransform(sceneClone, id, transform);
      set({ scene: sceneClone, isSceneDirty: true });
    },

    updateMaterial: (id: string, material: Partial<MaterialData>) => {
      const { scene } = get();
      if (!scene || !scene.gameObjects[id]) return;

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      SceneManager.updateMaterial(sceneClone, id, material);
      set({ scene: sceneClone, isSceneDirty: true });
    },

    updateLight: (id: string, light: Partial<LightData>) => {
      const { scene } = get();
      if (!scene || !scene.gameObjects[id]) return;

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      SceneManager.updateLight(sceneClone, id, light);
      set({ scene: sceneClone, isSceneDirty: true });
    },

    updateBehavior: (id: string, behavior: BehaviorData) => {
      const { scene } = get();
      if (!scene || !scene.gameObjects[id]) return;

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      SceneManager.updateBehavior(sceneClone, id, behavior);
      set({ scene: sceneClone, isSceneDirty: true });
    },

    setVisibility: (id: string, visible: boolean) => {
      const { scene } = get();
      if (!scene || !scene.gameObjects[id]) return;

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      SceneManager.setVisibility(sceneClone, id, visible);
      set({ scene: sceneClone, isSceneDirty: true });
    },

    reparentGameObject: (childId: string, newParentId: string | null) => {
      const { scene } = get();
      if (!scene) return false;
      pushUndo(scene);

      const sceneClone: SceneData = JSON.parse(JSON.stringify(scene));
      const res = SceneManager.reparent(sceneClone, childId, newParentId);
      if (res.success) {
        set({ scene: sceneClone });
        get().addLog('info', `Reparented GameObject (${childId}).`);
        return true;
      } else {
        get().addLog('error', res.error?.message || 'Reparenting failed');
        return false;
      }
    },

    // ── Editor Actions ─────────────────────────────────────────────────────────

    selectObject: (id: string | null) => {
      set({ selectedId: id });
    },

    setTransformMode: (mode: TransformMode) => {
      set({ transformMode: mode });
    },

    togglePlay: () => {
      const { isPlaying } = get();
      set({ isPlaying: !isPlaying });
      get().addLog('info', !isPlaying ? 'Entered Simulation Play Mode' : 'Returned to Editor Mode');
    },

    addLog: (level: LogLevel, message: string, details?: string) => {
      const entry: LogEntry = {
        id: generateUUID(),
        timestamp: Date.now(),
        level,
        message,
        details,
      };
      set((state) => ({
        logs: [...state.logs.slice(-100), entry],
      }));
    },

    clearLogs: () => {
      set({ logs: [] });
    },

    openModal: (modal) => {
      set({ activeModal: modal });
    },

    closeModal: () => {
      set({ activeModal: null });
    },

    // ── Undo / Redo Actions ───────────────────────────────────────────────────

    undo: () => {
      const { undoStack, scene, redoStack } = get();
      if (undoStack.length === 0 || !scene) return;

      const prev = undoStack[undoStack.length - 1];
      const newUndo = undoStack.slice(0, -1);
      set({
        scene: prev,
        undoStack: newUndo,
        redoStack: [scene, ...redoStack],
        isSceneDirty: true,
      });
      get().addLog('info', 'Undo action performed.');
    },

    redo: () => {
      const { redoStack, scene, undoStack } = get();
      if (redoStack.length === 0 || !scene) return;

      const next = redoStack[0];
      const newRedo = redoStack.slice(1);
      set({
        scene: next,
        redoStack: newRedo,
        undoStack: [...undoStack, scene],
        isSceneDirty: true,
      });
      get().addLog('info', 'Redo action performed.');
    },
  };
});
