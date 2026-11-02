import {
  EngineErrorCode,
  EngineResult,
  fail,
  GameObjectData,
  BehaviorData,
  LightData,
  MaterialData,
  ok,
  okVoid,
  PrimitiveType,
  SceneData,
  TransformData,
} from '../core/types';
import {
  DEFAULT_CAMERA,
  DEFAULT_ENVIRONMENT,
  DEFAULT_MATERIAL,
  DEFAULT_TRANSFORM,
  SCHEMA_VERSION,
} from '../core/constants';
import { generateUUID } from '../core/id';
import { StorageService } from './storage';
import { TransformSystem } from './transformSystem';

export class SceneManager {
  /**
   * Creates a default starting scene with a Cube, lighting, and camera.
   */
  static createDefaultScene(projectId: string, name = 'Default Scene'): SceneData {
    const sceneId = generateUUID();
    const cubeId = generateUUID();

    const cubeObject: GameObjectData = {
      id: cubeId,
      name: 'Default Cube',
      type: 'Cube',
      parentId: null,
      childIds: [],
      visible: true,
      transform: {
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      material: {
        color: '#3b82f6',
        roughness: 0.35,
        metalness: 0.15,
        wireframe: false,
        opacity: 1.0,
      },
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      id: sceneId,
      projectId,
      name,
      rootObjectIds: [cubeId],
      gameObjects: {
        [cubeId]: cubeObject,
      },
      camera: JSON.parse(JSON.stringify(DEFAULT_CAMERA)),
      environment: JSON.parse(JSON.stringify(DEFAULT_ENVIRONMENT)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * FR-06: Create a new scene.
   */
  static async createScene(projectId: string, name: string): Promise<EngineResult<SceneData>> {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return fail(EngineErrorCode.InvalidName, 'Scene name cannot be empty');
    }

    const scene: SceneData = {
      schemaVersion: SCHEMA_VERSION,
      id: generateUUID(),
      projectId,
      name: trimmed,
      rootObjectIds: [],
      gameObjects: {},
      camera: JSON.parse(JSON.stringify(DEFAULT_CAMERA)),
      environment: JSON.parse(JSON.stringify(DEFAULT_ENVIRONMENT)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const saveRes = await StorageService.saveScene(scene);
    if (!saveRes.success) return fail(saveRes.error!.code, saveRes.error!.message);

    return ok(scene);
  }

  /**
   * FR-07: Load an existing scene.
   */
  static async loadScene(sceneId: string): Promise<EngineResult<SceneData>> {
    return StorageService.getScene(sceneId);
  }

  /**
   * FR-08: Save scene data.
   */
  static async saveScene(scene: SceneData): Promise<EngineResult<void>> {
    if (!scene || !scene.id) {
      return fail(EngineErrorCode.InvalidArgument, 'Invalid scene data');
    }
    return StorageService.saveScene(scene);
  }

  /**
   * FR-09: Add GameObject to scene.
   */
  static addGameObject(
    scene: SceneData,
    type: PrimitiveType,
    name?: string,
    parentId?: string | null
  ): EngineResult<GameObjectData> {
    const id = generateUUID();
    const objectName = name && name.trim() ? name.trim() : `${type} ${Object.keys(scene.gameObjects).length + 1}`;

    const newObj: GameObjectData = {
      id,
      name: objectName,
      type,
      parentId: parentId || null,
      childIds: [],
      visible: true,
      transform: JSON.parse(JSON.stringify(DEFAULT_TRANSFORM)),
      material: JSON.parse(JSON.stringify(DEFAULT_MATERIAL)),
    };

    // Set reasonable defaults for different primitives
    if (type === 'Plane') {
      newObj.transform.scale = [5, 1, 5];
      newObj.material.color = '#475569';
      newObj.material.roughness = 0.8;
    } else if (type === 'Sphere') {
      newObj.transform.position = [0, 0.5, 0];
      newObj.material.color = '#ef4444';
    } else if (type === 'Cylinder') {
      newObj.transform.position = [0, 0.5, 0];
      newObj.material.color = '#10b981';
    } else if (type === 'Torus') {
      newObj.transform.position = [0, 0.5, 0];
      newObj.material.color = '#8b5cf6';
    } else if (type === 'PointLight') {
      newObj.transform.position = [0, 2.5, 0];
      newObj.material.color = '#fbbf24';
      newObj.light = { intensity: 5, distance: 15, decay: 2 };
    } else if (type === 'SpotLight') {
      newObj.transform.position = [0, 3.5, 0];
      newObj.material.color = '#f59e0b';
      newObj.light = { intensity: 8, distance: 20, decay: 2 };
    } else if (type === 'Empty') {
      newObj.visible = true;
    }

    // Add to gameObjects map
    scene.gameObjects[id] = newObj;

    // Attach to parent or root
    if (parentId && scene.gameObjects[parentId]) {
      scene.gameObjects[parentId].childIds.push(id);
    } else {
      newObj.parentId = null;
      scene.rootObjectIds.push(id);
    }

    scene.updatedAt = Date.now();
    return ok(newObj);
  }

  /**
   * FR-09: Remove GameObject from scene.
   * Promotes child objects to the deleted object's parent (or root) to prevent dangling references.
   */
  static removeGameObject(scene: SceneData, objectId: string): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) {
      return fail(EngineErrorCode.NotFound, `GameObject with ID ${objectId} not found`);
    }

    const parentId = obj.parentId;

    // 1. Re-parent children to obj.parentId (orphan prevention)
    for (const childId of obj.childIds) {
      const child = scene.gameObjects[childId];
      if (child) {
        child.parentId = parentId;
        if (parentId && scene.gameObjects[parentId]) {
          scene.gameObjects[parentId].childIds.push(childId);
        } else {
          child.parentId = null;
          if (!scene.rootObjectIds.includes(childId)) {
            scene.rootObjectIds.push(childId);
          }
        }
      }
    }

    // 2. Unlink obj from its parent's child list
    if (parentId && scene.gameObjects[parentId]) {
      const parent = scene.gameObjects[parentId];
      parent.childIds = parent.childIds.filter((id) => id !== objectId);
    } else {
      scene.rootObjectIds = scene.rootObjectIds.filter((id) => id !== objectId);
    }

    // 3. Remove object from scene
    delete scene.gameObjects[objectId];
    scene.updatedAt = Date.now();
    return okVoid();
  }

  /**
   * Rename a GameObject.
   */
  static renameGameObject(scene: SceneData, objectId: string, newName: string): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) return fail(EngineErrorCode.NotFound, `GameObject ${objectId} not found`);
    const trimmed = (newName || '').trim();
    if (!trimmed) return fail(EngineErrorCode.InvalidName, 'Name cannot be empty');
    obj.name = trimmed;
    scene.updatedAt = Date.now();
    return okVoid();
  }

  /**
   * FR-10: Update object transform.
   */
  static updateTransform(
    scene: SceneData,
    objectId: string,
    transform: Partial<TransformData>
  ): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) return fail(EngineErrorCode.NotFound, `GameObject ${objectId} not found`);

    if (transform.position) obj.transform.position = [...transform.position];
    if (transform.rotation) obj.transform.rotation = [...transform.rotation];
    if (transform.scale) obj.transform.scale = [...transform.scale];

    scene.updatedAt = Date.now();
    return okVoid();
  }

  /**
   * Update object material.
   */
  static updateMaterial(
    scene: SceneData,
    objectId: string,
    material: Partial<MaterialData>
  ): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) return fail(EngineErrorCode.NotFound, `GameObject ${objectId} not found`);

    obj.material = { ...obj.material, ...material };
    scene.updatedAt = Date.now();
    return okVoid();
  }

  /**
   * Set object visibility.
   */
  static updateLight(
    scene: SceneData,
    objectId: string,
    light: Partial<LightData>
  ): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) return fail(EngineErrorCode.NotFound, `GameObject ${objectId} not found`);

    obj.light = {
      intensity: 5,
      distance: 15,
      decay: 2,
      ...(obj.light || {}),
      ...light,
    };
    scene.updatedAt = Date.now();
    return okVoid();
  }

  static updateBehavior(
    scene: SceneData,
    objectId: string,
    behavior: BehaviorData
  ): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) return fail(EngineErrorCode.NotFound, `GameObject ${objectId} not found`);

    obj.behavior = { ...behavior };
    scene.updatedAt = Date.now();
    return okVoid();
  }

  static setVisibility(scene: SceneData, objectId: string, visible: boolean): EngineResult<void> {
    const obj = scene.gameObjects[objectId];
    if (!obj) return fail(EngineErrorCode.NotFound, `GameObject ${objectId} not found`);

    obj.visible = visible;
    scene.updatedAt = Date.now();
    return okVoid();
  }

  /**
   * FR-11: Reparent GameObject with cycle detection.
   */
  static reparent(scene: SceneData, childId: string, newParentId: string | null): EngineResult<void> {
    const res = TransformSystem.reparent(scene, childId, newParentId);
    if (!res.success) {
      return fail(EngineErrorCode.CircularHierarchy, res.error || 'Reparenting failed');
    }
    scene.updatedAt = Date.now();
    return okVoid();
  }
}
