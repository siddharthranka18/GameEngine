import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManager } from '../../src/services/projectManager';
import { EngineErrorCode } from '../../src/core/types';
import { StorageService } from '../../src/services/storage';

describe('ProjectManager (FR-01 to FR-05)', () => {
  it('TEST-PROJ-01: Creates a new project with valid metadata and default scene', async () => {
    const res = await ProjectManager.createProject('My Test Game');
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    const { project, defaultScene } = res.data!;
    expect(project.name).toBe('My Test Game');
    expect(project.id).toBeDefined();
    expect(project.sceneIds).toContain(defaultScene.id);
    expect(project.startupSceneId).toBe(defaultScene.id);
    expect(defaultScene.rootObjectIds.length).toBeGreaterThan(0);
  });

  it('TEST-PROJ-01-FAIL: Rejects empty project name', async () => {
    const res = await ProjectManager.createProject('   ');
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe(EngineErrorCode.InvalidName);
  });

  it('TEST-PROJ-02: Opens an existing project by ID', async () => {
    const createRes = await ProjectManager.createProject('Game To Open');
    const projId = createRes.data!.project.id;

    const openRes = await ProjectManager.openProject(projId);
    expect(openRes.success).toBe(true);
    expect(openRes.data?.project.id).toBe(projId);
    expect(openRes.data?.startupScene).toBeDefined();
  });

  it('TEST-PROJ-02-FAIL: Returns NotFound for non-existent project ID', async () => {
    const openRes = await ProjectManager.openProject('non-existent-uuid-1234');
    expect(openRes.success).toBe(false);
    expect(openRes.error?.code).toBe(EngineErrorCode.NotFound);
  });

  it('TEST-PROJ-03: Saves project state updates', async () => {
    const createRes = await ProjectManager.createProject('Save Test');
    const project = createRes.data!.project;

    project.name = 'Renamed Game Project';
    const saveRes = await ProjectManager.saveProject(project);
    expect(saveRes.success).toBe(true);

    const reloadRes = await StorageService.getProject(project.id);
    expect(reloadRes.success).toBe(true);
    expect(reloadRes.data?.name).toBe('Renamed Game Project');
  });

  it('TEST-PROJ-04: Closes project cleanly', () => {
    const closeRes = ProjectManager.closeProject();
    expect(closeRes.success).toBe(true);
  });

  it('TEST-PROJ-05: Updates project configuration settings', async () => {
    const createRes = await ProjectManager.createProject('Config Test');
    const project = createRes.data!.project;

    // Set build target
    ProjectManager.setBuildTarget(project, 'Windows');
    expect(project.config.buildTarget).toBe('Windows');

    // Set custom setting
    ProjectManager.setCustomSetting(project, 'Author', 'Epstein Team');
    expect(project.config.customSettings['Author']).toBe('Epstein Team');

    // Startup scene validation
    const invalidRes = ProjectManager.setStartupScene(project, 'fake-scene-id');
    expect(invalidRes.success).toBe(false);
  });
});
