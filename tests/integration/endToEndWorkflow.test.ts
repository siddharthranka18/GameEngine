import { describe, it, expect } from 'vitest';
import { ProjectManager } from '../../src/services/projectManager';
import { SceneManager } from '../../src/services/sceneManager';
import { StorageService } from '../../src/services/storage';

describe('End-to-End Complete Integration Workflow', () => {
  it('TEST-INT-01: Executes 12-step complete create -> transform -> hierarchy -> save -> close -> reopen -> restore cycle', async () => {
    // 1. Create a project
    const projRes = await ProjectManager.createProject('Epstein Adventure');
    expect(projRes.success).toBe(true);
    const project = projRes.data!.project;

    // 2. Create a scene
    const sceneRes = await SceneManager.createScene(project.id, 'Main Gameplay Scene');
    expect(sceneRes.success).toBe(true);
    const scene = sceneRes.data!;
    project.sceneIds.push(scene.id);
    project.startupSceneId = scene.id;
    await ProjectManager.saveProject(project);

    // 3. Add a cube
    const cubeRes = SceneManager.addGameObject(scene, 'Cube', 'PlayerBox');
    expect(cubeRes.success).toBe(true);
    const cube = cubeRes.data!;

    // 4. Add a sphere
    const sphereRes = SceneManager.addGameObject(scene, 'Sphere', 'OrbitBall');
    expect(sphereRes.success).toBe(true);
    const sphere = sphereRes.data!;

    // 5. Add a plane
    const planeRes = SceneManager.addGameObject(scene, 'Plane', 'GroundFloor');
    expect(planeRes.success).toBe(true);
    const plane = planeRes.data!;

    // 6. Change object positions and rotations
    SceneManager.updateTransform(scene, cube.id, {
      position: [0, 1.5, 0],
      rotation: [0, 45, 0],
      scale: [1.2, 1.2, 1.2],
    });
    SceneManager.updateTransform(scene, sphere.id, {
      position: [2.5, 0, 0],
      rotation: [0, 0, 0],
    });
    SceneManager.updateTransform(scene, plane.id, {
      position: [0, 0, 0],
      scale: [10, 1, 10],
    });

    // 7. Create a parent-child relationship (OrbitBall child of PlayerBox)
    const reparentRes = SceneManager.reparent(scene, sphere.id, cube.id);
    expect(reparentRes.success).toBe(true);
    expect(scene.gameObjects[cube.id].childIds).toContain(sphere.id);
    expect(scene.gameObjects[sphere.id].parentId).toBe(cube.id);

    // 8. Save the scene
    const saveSceneRes = await SceneManager.saveScene(scene);
    expect(saveSceneRes.success).toBe(true);

    // 9. Close the project
    const closeRes = ProjectManager.closeProject();
    expect(closeRes.success).toBe(true);

    // 10. Reopen the project
    const reopenRes = await ProjectManager.openProject(project.id);
    expect(reopenRes.success).toBe(true);
    const restoredProject = reopenRes.data!.project;
    expect(restoredProject.name).toBe('Epstein Adventure');

    // 11. Load the scene
    const reloadSceneRes = await SceneManager.loadScene(scene.id);
    expect(reloadSceneRes.success).toBe(true);
    const restoredScene = reloadSceneRes.data!;

    // 12. Verify objects, transforms, and hierarchy are restored correctly
    expect(restoredScene.name).toBe('Main Gameplay Scene');
    expect(Object.keys(restoredScene.gameObjects).length).toBe(3);

    const restoredCube = restoredScene.gameObjects[cube.id];
    const restoredSphere = restoredScene.gameObjects[sphere.id];
    const restoredPlane = restoredScene.gameObjects[plane.id];

    expect(restoredCube).toBeDefined();
    expect(restoredSphere).toBeDefined();
    expect(restoredPlane).toBeDefined();

    // Verify transform fidelity
    expect(restoredCube.transform.position).toEqual([0, 1.5, 0]);
    expect(restoredCube.transform.rotation).toEqual([0, 45, 0]);
    expect(restoredCube.transform.scale).toEqual([1.2, 1.2, 1.2]);

    expect(restoredSphere.transform.position).toEqual([2.5, 0, 0]);
    expect(restoredPlane.transform.scale).toEqual([10, 1, 10]);

    // Verify hierarchy fidelity
    expect(restoredCube.childIds).toContain(sphere.id);
    expect(restoredSphere.parentId).toBe(cube.id);
    expect(restoredScene.rootObjectIds).toContain(cube.id);
    expect(restoredScene.rootObjectIds).toContain(plane.id);
    expect(restoredScene.rootObjectIds).not.toContain(sphere.id);
  });
});
