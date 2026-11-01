import { describe, it, expect } from 'vitest';
import { StorageService } from '../../src/services/storage';
import { ProjectManager } from '../../src/services/projectManager';
import { SceneManager } from '../../src/services/sceneManager';

describe('StorageService (IndexedDB & JSON Export/Import)', () => {
  it('TEST-STORE-01: Exports project package and imports back cleanly', async () => {
    const { project, defaultScene } = (await ProjectManager.createProject('Exportable Game')).data!;
    SceneManager.addGameObject(defaultScene, 'Sphere', 'ExportSphere');

    const jsonPackage = StorageService.exportProjectPackage(project, [defaultScene]);
    expect(typeof jsonPackage).toBe('string');
    expect(jsonPackage).toContain('epstein_project_package');

    const importRes = StorageService.importProjectPackage(jsonPackage);
    expect(importRes.success).toBe(true);
    expect(importRes.data?.project.name).toBe('Exportable Game');
    expect(importRes.data?.scenes.length).toBe(1);
    expect(importRes.data?.scenes[0].name).toBe('Default Scene');
  });

  it('TEST-STORE-02: Handles corrupted / malformed JSON strings gracefully', () => {
    const badJson = '{ invalid_json: true, ... ';
    const res = StorageService.importProjectPackage(badJson);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBeDefined();
  });

  it('TEST-STORE-03: Exports and imports individual scene JSON', async () => {
    const scene = SceneManager.createDefaultScene('p-single', 'SingleScene');
    const json = StorageService.exportSceneJSON(scene);
    expect(json).toContain('SingleScene');

    const res = StorageService.importSceneJSON(json);
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('SingleScene');
  });
});
