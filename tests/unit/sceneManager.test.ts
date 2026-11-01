import { describe, it, expect } from 'vitest';
import { SceneManager } from '../../src/services/sceneManager';
import { EngineErrorCode } from '../../src/core/types';
import { StorageService } from '../../src/services/storage';

describe('SceneManager (FR-06 to FR-11)', () => {
  it('TEST-SCENE-01: Creates a new scene associated with a project', async () => {
    const res = await SceneManager.createScene('proj-123', 'Level 1');
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Level 1');
    expect(res.data?.projectId).toBe('proj-123');
    expect(res.data?.camera).toBeDefined();
    expect(res.data?.environment).toBeDefined();
  });

  it('TEST-SCENE-02: Saves and loads an existing scene', async () => {
    const createRes = await SceneManager.createScene('proj-123', 'Level 2');
    const scene = createRes.data!;

    // Add object before saving
    SceneManager.addGameObject(scene, 'Sphere', 'HeroSphere');
    const saveRes = await SceneManager.saveScene(scene);
    expect(saveRes.success).toBe(true);

    const loadRes = await SceneManager.loadScene(scene.id);
    expect(loadRes.success).toBe(true);
    expect(loadRes.data?.name).toBe('Level 2');
    expect(Object.keys(loadRes.data!.gameObjects).length).toBe(1);
  });

  it('TEST-SCENE-03: Adds multiple primitives correctly', () => {
    const scene = SceneManager.createDefaultScene('proj-123', 'TestScene');
    const initialCount = Object.keys(scene.gameObjects).length;

    const cube = SceneManager.addGameObject(scene, 'Cube', 'BoxA');
    const sphere = SceneManager.addGameObject(scene, 'Sphere', 'BallB');
    const plane = SceneManager.addGameObject(scene, 'Plane', 'Ground');
    const cylinder = SceneManager.addGameObject(scene, 'Cylinder', 'Pillar');

    expect(cube.success).toBe(true);
    expect(sphere.success).toBe(true);
    expect(plane.success).toBe(true);
    expect(cylinder.success).toBe(true);
    expect(Object.keys(scene.gameObjects).length).toBe(initialCount + 4);
  });

  it('TEST-SCENE-04: Removes GameObject and preserves children (no dangling refs)', () => {
    const scene = SceneManager.createDefaultScene('proj-123', 'ParentScene');

    // Add Parent and Child
    const parent = SceneManager.addGameObject(scene, 'Cube', 'ParentCube').data!;
    const child = SceneManager.addGameObject(scene, 'Sphere', 'ChildSphere', parent.id).data!;

    expect(scene.gameObjects[parent.id].childIds).toContain(child.id);
    expect(scene.gameObjects[child.id].parentId).toBe(parent.id);

    // Remove Parent
    const remRes = SceneManager.removeGameObject(scene, parent.id);
    expect(remRes.success).toBe(true);
    expect(scene.gameObjects[parent.id]).toBeUndefined();

    // Verify Child was promoted to root and not deleted or orphaned with dangling parentId
    expect(scene.gameObjects[child.id]).toBeDefined();
    expect(scene.gameObjects[child.id].parentId).toBeNull();
    expect(scene.rootObjectIds).toContain(child.id);
  });

  it('TEST-SCENE-05: Modifies transform position, rotation, and scale', () => {
    const scene = SceneManager.createDefaultScene('proj-123', 'TransformScene');
    const obj = SceneManager.addGameObject(scene, 'Cube', 'MovableBox').data!;

    SceneManager.updateTransform(scene, obj.id, {
      position: [10, 2.5, -5],
      rotation: [45, 90, 0],
      scale: [2, 3, 2],
    });

    const updated = scene.gameObjects[obj.id];
    expect(updated.transform.position).toEqual([10, 2.5, -5]);
    expect(updated.transform.rotation).toEqual([45, 90, 0]);
    expect(updated.transform.scale).toEqual([2, 3, 2]);
  });

  it('TEST-SCENE-06: Renames and toggles visibility of GameObjects', () => {
    const scene = SceneManager.createDefaultScene('proj-123', 'VisScene');
    const obj = SceneManager.addGameObject(scene, 'Cube', 'OldName').data!;

    SceneManager.renameGameObject(scene, obj.id, 'NewName');
    expect(scene.gameObjects[obj.id].name).toBe('NewName');

    SceneManager.setVisibility(scene, obj.id, false);
    expect(scene.gameObjects[obj.id].visible).toBe(false);
  });
});
