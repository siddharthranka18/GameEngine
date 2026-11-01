import { describe, it, expect } from 'vitest';
import { TransformSystem } from '../../src/services/transformSystem';
import { SceneManager } from '../../src/services/sceneManager';

describe('TransformSystem & Hierarchy Logic', () => {
  it('TEST-TRANS-01: Correctly prevents circular hierarchy (Direct Cycle)', () => {
    const scene = SceneManager.createDefaultScene('p1', 'CycleScene');
    const objA = SceneManager.addGameObject(scene, 'Cube', 'A').data!;
    const objB = SceneManager.addGameObject(scene, 'Cube', 'B', objA.id).data!;

    // Attempting to make A a child of B when B is already a child of A!
    const cycle = TransformSystem.wouldCreateCycle(objA.id, objB.id, scene.gameObjects);
    expect(cycle).toBe(true);

    const reparentRes = SceneManager.reparent(scene, objA.id, objB.id);
    expect(reparentRes.success).toBe(false);
  });

  it('TEST-TRANS-02: Correctly prevents deep circular hierarchy (A -> B -> C -> A)', () => {
    const scene = SceneManager.createDefaultScene('p1', 'DeepCycle');
    const a = SceneManager.addGameObject(scene, 'Cube', 'A').data!;
    const b = SceneManager.addGameObject(scene, 'Cube', 'B', a.id).data!;
    const c = SceneManager.addGameObject(scene, 'Cube', 'C', b.id).data!;

    // Attempt to make A a child of C
    const cycle = TransformSystem.wouldCreateCycle(a.id, c.id, scene.gameObjects);
    expect(cycle).toBe(true);

    const res = SceneManager.reparent(scene, a.id, c.id);
    expect(res.success).toBe(false);
  });

  it('TEST-TRANS-03: Successfully reparents without cycles', () => {
    const scene = SceneManager.createDefaultScene('p1', 'ValidReparent');
    const a = SceneManager.addGameObject(scene, 'Cube', 'A').data!;
    const b = SceneManager.addGameObject(scene, 'Sphere', 'B').data!;

    // Both are currently root
    expect(scene.rootObjectIds).toContain(a.id);
    expect(scene.rootObjectIds).toContain(b.id);

    // Reparent B under A
    const res = SceneManager.reparent(scene, b.id, a.id);
    expect(res.success).toBe(true);
    expect(scene.gameObjects[a.id].childIds).toContain(b.id);
    expect(scene.gameObjects[b.id].parentId).toBe(a.id);
    expect(scene.rootObjectIds).not.toContain(b.id);

    // Reparent B back to root (null parent)
    const rootRes = SceneManager.reparent(scene, b.id, null);
    expect(rootRes.success).toBe(true);
    expect(scene.gameObjects[a.id].childIds).not.toContain(b.id);
    expect(scene.gameObjects[b.id].parentId).toBeNull();
    expect(scene.rootObjectIds).toContain(b.id);
  });

  it('TEST-TRANS-04: Computes world matrix propagation down hierarchy', () => {
    const scene = SceneManager.createDefaultScene('p1', 'MatrixScene');
    const parent = SceneManager.addGameObject(scene, 'Cube', 'Parent').data!;
    const child = SceneManager.addGameObject(scene, 'Cube', 'Child', parent.id).data!;

    // Translate parent to X = 10
    SceneManager.updateTransform(scene, parent.id, { position: [10, 0, 0] });
    // Translate child to local X = 5
    SceneManager.updateTransform(scene, child.id, { position: [5, 0, 0] });

    // Child world position should be 10 + 5 = 15
    const childWorld = TransformSystem.computeWorldTransform(child.id, scene.gameObjects);
    expect(childWorld.position[0]).toBeCloseTo(15);
    expect(childWorld.position[1]).toBeCloseTo(0);
    expect(childWorld.position[2]).toBeCloseTo(0);
  });
});
