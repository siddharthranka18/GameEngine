import * as THREE from 'three';
import { GameObjectData, SceneData, TransformData } from '../core/types';
import { computeLocalMatrix, decomposeMatrix, multiplyMatrices } from '../core/math';

export class TransformSystem {
  /**
   * Checks whether parenting childId under newParentId would create a cycle in the hierarchy.
   * Returns true if a cycle WOULD be created (i.e. invalid), false if safe.
   */
  static wouldCreateCycle(
    childId: string,
    newParentId: string | null,
    gameObjects: Record<string, GameObjectData>
  ): boolean {
    if (!newParentId) return false;
    if (childId === newParentId) return true;

    let currentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === childId) {
        return true; // Found childId in ancestor chain -> Cycle!
      }
      if (visited.has(currentId)) {
        return true; // Existing loop in graph -> Cycle!
      }
      visited.add(currentId);
      const parentObj: GameObjectData | undefined = gameObjects[currentId];
      currentId = parentObj ? parentObj.parentId : null;
    }

    return false;
  }

  /**
   * Computes the world transformation matrix of an object by traversing up to root.
   */
  static computeWorldMatrix(
    objectId: string,
    gameObjects: Record<string, GameObjectData>
  ): THREE.Matrix4 {
    const obj = gameObjects[objectId];
    if (!obj) return new THREE.Matrix4();

    const localMatrix = computeLocalMatrix(obj.transform);
    if (!obj.parentId) {
      return localMatrix;
    }

    const parentWorldMatrix = this.computeWorldMatrix(obj.parentId, gameObjects);
    return multiplyMatrices(parentWorldMatrix, localMatrix);
  }

  /**
   * Computes world transform data (position, rotation in degrees, scale) for an object.
   */
  static computeWorldTransform(
    objectId: string,
    gameObjects: Record<string, GameObjectData>
  ): TransformData {
    const worldMatrix = this.computeWorldMatrix(objectId, gameObjects);
    return decomposeMatrix(worldMatrix);
  }

  /**
   * Validates and performs hierarchy reparenting in a SceneData object.
   */
  static reparent(
    scene: SceneData,
    childId: string,
    newParentId: string | null
  ): { success: boolean; error?: string } {
    const child = scene.gameObjects[childId];
    if (!child) {
      return { success: false, error: `Object ${childId} not found` };
    }

    if (newParentId && !scene.gameObjects[newParentId]) {
      return { success: false, error: `Target parent ${newParentId} not found` };
    }

    if (this.wouldCreateCycle(childId, newParentId, scene.gameObjects)) {
      return { success: false, error: 'Cannot reparent: this would create a circular hierarchy' };
    }

    // 1. Unlink from old parent
    if (child.parentId && scene.gameObjects[child.parentId]) {
      const oldParent = scene.gameObjects[child.parentId];
      oldParent.childIds = oldParent.childIds.filter((id) => id !== childId);
    } else {
      // Was a root object
      scene.rootObjectIds = scene.rootObjectIds.filter((id) => id !== childId);
    }

    // 2. Link to new parent
    if (newParentId) {
      const newParent = scene.gameObjects[newParentId];
      if (!newParent.childIds.includes(childId)) {
        newParent.childIds.push(childId);
      }
      child.parentId = newParentId;
    } else {
      // Reparenting to root
      child.parentId = null;
      if (!scene.rootObjectIds.includes(childId)) {
        scene.rootObjectIds.push(childId);
      }
    }

    return { success: true };
  }
}
