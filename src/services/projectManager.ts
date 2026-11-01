import {
  EngineErrorCode,
  EngineResult,
  fail,
  ok,
  okVoid,
  ProjectData,
  SceneData,
} from '../core/types';
import { DEFAULT_PROJECT_CONFIG, ENGINE_VERSION, SCHEMA_VERSION } from '../core/constants';
import { generateUUID } from '../core/id';
import { StorageService } from './storage';
import { SceneManager } from './sceneManager';

export class ProjectManager {
  /**
   * FR-01: Create a new project.
   */
  static async createProject(name: string): Promise<EngineResult<{ project: ProjectData; defaultScene: SceneData }>> {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return fail(EngineErrorCode.InvalidName, 'Project name cannot be empty');
    }

    const projectId = generateUUID();
    const defaultScene = SceneManager.createDefaultScene(projectId, 'Default Scene');

    const project: ProjectData = {
      schemaVersion: SCHEMA_VERSION,
      id: projectId,
      name: trimmed,
      engineVersion: ENGINE_VERSION,
      sceneIds: [defaultScene.id],
      startupSceneId: defaultScene.id,
      config: JSON.parse(JSON.stringify(DEFAULT_PROJECT_CONFIG)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save project and default scene
    const saveProjRes = await StorageService.saveProject(project);
    if (!saveProjRes.success) return fail(saveProjRes.error!.code, saveProjRes.error!.message);

    const saveSceneRes = await StorageService.saveScene(defaultScene);
    if (!saveSceneRes.success) return fail(saveSceneRes.error!.code, saveSceneRes.error!.message);

    return ok({ project, defaultScene });
  }

  /**
   * FR-02: Open an existing project by ID.
   */
  static async openProject(id: string): Promise<EngineResult<{ project: ProjectData; startupScene?: SceneData }>> {
    const projRes = await StorageService.getProject(id);
    if (!projRes.success || !projRes.data) {
      return fail(projRes.error?.code || EngineErrorCode.NotFound, projRes.error?.message || 'Project not found');
    }

    const project = projRes.data;
    let startupScene: SceneData | undefined;

    if (project.startupSceneId) {
      const sceneRes = await StorageService.getScene(project.startupSceneId);
      if (sceneRes.success) {
        startupScene = sceneRes.data;
      }
    } else if (project.sceneIds.length > 0) {
      const sceneRes = await StorageService.getScene(project.sceneIds[0]);
      if (sceneRes.success) {
        startupScene = sceneRes.data;
      }
    }

    return ok({ project, startupScene });
  }

  /**
   * FR-03: Save project data.
   */
  static async saveProject(project: ProjectData): Promise<EngineResult<void>> {
    if (!project || !project.id) {
      return fail(EngineErrorCode.InvalidArgument, 'Invalid project data provided for save');
    }
    return StorageService.saveProject(project);
  }

  /**
   * FR-04: Close a project.
   */
  static closeProject(): EngineResult<void> {
    // Client-side cleanup of project state
    return okVoid();
  }

  /**
   * FR-05: Configure project settings.
   */
  static setStartupScene(project: ProjectData, sceneId: string): EngineResult<void> {
    if (sceneId && !project.sceneIds.includes(sceneId)) {
      return fail(EngineErrorCode.NotFound, `Scene ID ${sceneId} is not registered in this project`);
    }
    project.startupSceneId = sceneId;
    return okVoid();
  }

  static setBuildTarget(project: ProjectData, target: string): EngineResult<void> {
    project.config.buildTarget = target;
    return okVoid();
  }

  static setCustomSetting(project: ProjectData, key: string, value: string): EngineResult<void> {
    if (!key.trim()) {
      return fail(EngineErrorCode.InvalidArgument, 'Setting key cannot be empty');
    }
    project.config.customSettings[key.trim()] = value;
    return okVoid();
  }
}
