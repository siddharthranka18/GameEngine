import {
  EngineErrorCode,
  EngineResult,
  fail,
  ok,
  okVoid,
  ProjectData,
  SceneData,
} from '../core/types';
import { SCHEMA_VERSION } from '../core/constants';
import { isValidUUID } from '../core/id';

const DB_NAME = 'epstein_engine_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SCENES = 'scenes';

// In-memory fallback for environments without full IndexedDB (e.g., SSR or tests)
const memoryProjects = new Map<string, ProjectData>();
const memoryScenes = new Map<string, SceneData>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SCENES)) {
        db.createObjectStore(STORE_SCENES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class StorageService {
  // ── Project Persistence ──────────────────────────────────────────────────────

  static async saveProject(project: ProjectData): Promise<EngineResult<void>> {
    try {
      project.updatedAt = Date.now();
      try {
        const db = await openDatabase();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([STORE_PROJECTS], 'readwrite');
          const store = tx.objectStore(STORE_PROJECTS);
          const req = store.put(project);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch {
        // Fallback to memory
        memoryProjects.set(project.id, { ...project });
      }
      return okVoid();
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to save project');
    }
  }

  static async getProject(id: string): Promise<EngineResult<ProjectData>> {
    try {
      try {
        const db = await openDatabase();
        const project = await new Promise<ProjectData | undefined>((resolve, reject) => {
          const tx = db.transaction([STORE_PROJECTS], 'readonly');
          const store = tx.objectStore(STORE_PROJECTS);
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        if (project) {
          return ok(project);
        }
      } catch {
        // Try memory fallback
      }

      const memProj = memoryProjects.get(id);
      if (memProj) {
        return ok(memProj);
      }
      return fail(EngineErrorCode.NotFound, `Project with ID ${id} not found`);
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to retrieve project');
    }
  }

  static async listProjects(): Promise<EngineResult<ProjectData[]>> {
    try {
      try {
        const db = await openDatabase();
        const projects = await new Promise<ProjectData[]>((resolve, reject) => {
          const tx = db.transaction([STORE_PROJECTS], 'readonly');
          const store = tx.objectStore(STORE_PROJECTS);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });

        if (projects.length > 0) {
          return ok(projects);
        }
      } catch {
        // Fallback to memory
      }
      return ok(Array.from(memoryProjects.values()));
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to list projects');
    }
  }

  static async deleteProject(id: string): Promise<EngineResult<void>> {
    try {
      try {
        const db = await openDatabase();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([STORE_PROJECTS], 'readwrite');
          const store = tx.objectStore(STORE_PROJECTS);
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch {
        // Memory fallback
      }
      memoryProjects.delete(id);
      return okVoid();
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to delete project');
    }
  }

  // ── Scene Persistence ────────────────────────────────────────────────────────

  static async saveScene(scene: SceneData): Promise<EngineResult<void>> {
    try {
      scene.updatedAt = Date.now();
      try {
        const db = await openDatabase();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([STORE_SCENES], 'readwrite');
          const store = tx.objectStore(STORE_SCENES);
          const req = store.put(scene);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch {
        memoryScenes.set(scene.id, { ...scene });
      }
      return okVoid();
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to save scene');
    }
  }

  static async getScene(id: string): Promise<EngineResult<SceneData>> {
    try {
      try {
        const db = await openDatabase();
        const scene = await new Promise<SceneData | undefined>((resolve, reject) => {
          const tx = db.transaction([STORE_SCENES], 'readonly');
          const store = tx.objectStore(STORE_SCENES);
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        if (scene) {
          return ok(scene);
        }
      } catch {
        // Try memory fallback
      }

      const memScene = memoryScenes.get(id);
      if (memScene) {
        return ok(memScene);
      }
      return fail(EngineErrorCode.NotFound, `Scene with ID ${id} not found`);
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to retrieve scene');
    }
  }

  static async deleteScene(id: string): Promise<EngineResult<void>> {
    try {
      try {
        const db = await openDatabase();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([STORE_SCENES], 'readwrite');
          const store = tx.objectStore(STORE_SCENES);
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch {
        // Memory fallback
      }
      memoryScenes.delete(id);
      return okVoid();
    } catch (e: any) {
      return fail(EngineErrorCode.IOError, e?.message || 'Failed to delete scene');
    }
  }

  // ── JSON Import / Export & Validation ────────────────────────────────────────

  static exportProjectPackage(project: ProjectData, scenes: SceneData[]): string {
    const pkg = {
      format: 'epstein_project_package',
      schemaVersion: SCHEMA_VERSION,
      project,
      scenes,
    };
    return JSON.stringify(pkg, null, 2);
  }

  static importProjectPackage(jsonStr: string): EngineResult<{ project: ProjectData; scenes: SceneData[] }> {
    try {
      if (!jsonStr || typeof jsonStr !== 'string') {
        return fail(EngineErrorCode.InvalidArgument, 'Empty or invalid JSON content');
      }
      const data = JSON.parse(jsonStr);

      if (!data || typeof data !== 'object') {
        return fail(EngineErrorCode.DeserializationFailed, 'Parsed JSON is not an object');
      }

      if (data.format !== 'epstein_project_package') {
        // Could be direct ProjectData
        if (data.id && data.name && Array.isArray(data.sceneIds)) {
          return ok({ project: data, scenes: [] });
        }
        return fail(EngineErrorCode.DeserializationFailed, 'Unrecognized project package format');
      }

      const project = data.project as ProjectData;
      if (!project || !project.id || !project.name) {
        return fail(EngineErrorCode.DeserializationFailed, 'Missing required project fields in package');
      }

      const scenes = Array.isArray(data.scenes) ? (data.scenes as SceneData[]) : [];
      return ok({ project, scenes });
    } catch (e: any) {
      return fail(EngineErrorCode.DeserializationFailed, `Malformed JSON: ${e?.message}`);
    }
  }

  static exportSceneJSON(scene: SceneData): string {
    return JSON.stringify(scene, null, 2);
  }

  static importSceneJSON(jsonStr: string): EngineResult<SceneData> {
    try {
      if (!jsonStr || typeof jsonStr !== 'string') {
        return fail(EngineErrorCode.InvalidArgument, 'Empty JSON content');
      }
      const scene = JSON.parse(jsonStr) as SceneData;
      if (!scene || !scene.id || !scene.name || !scene.gameObjects) {
        return fail(EngineErrorCode.DeserializationFailed, 'Missing required scene fields');
      }
      return ok(scene);
    } catch (e: any) {
      return fail(EngineErrorCode.DeserializationFailed, `Malformed scene JSON: ${e?.message}`);
    }
  }
}
