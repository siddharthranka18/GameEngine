# EPSTEIN ENGINE — Revised Technical Implementation Blueprint (Web Edition v3.0)

## 1. Architecture Overview

EPSTEIN ENGINE Web Edition is a client-side, zero-install 3D game engine and scene editor built with modern web technologies:
- **Core Framework**: React 18 / 19 with TypeScript
- **Bundler & Tooling**: Vite with strict TypeScript configuration
- **3D Graphics Engine**: Three.js, `@react-three/fiber` (declarative Three.js scene graph), `@react-three/drei` (camera controls, gizmos, environment)
- **State Architecture**: Zustand with modular slices:
  - `projectSlice`: Active project metadata, project list, open/close/save actions
  - `sceneSlice`: Active scene, normalized GameObject map, root entity IDs, CRUD operations, hierarchy manipulation
  - `editorSlice`: Active selection, active transform mode (translate, rotate, scale), camera settings, simulation mode (edit / play), console logs
  - `historySlice`: Action-based command stack for undo/redo
- **Persistence Layer**:
  - Primary offline storage: IndexedDB (`epstein_engine_db`) with `projects` and `scenes` object stores
  - Portability: JSON file export and import (.epstein.json / .epstein-scene.json)
- **UI Architecture**: Sleek dark studio design with Tailwind CSS and Lucide React icons

---

## 2. Directory Structure

```text
gameEngine/
├── docs/                             # SRS, Diagrams, Traceability
│   ├── EPSTEIN_ENGINE_SRS_WEB_v3.md
│   ├── DIAGRAMS_AND_TRACEABILITY_v3.md
│   └── BLUEPRINT_WEB_v3.md
├── src/
│   ├── core/
│   │   ├── types.ts                  # Domain models: Project, Scene, GameObject, Transform, etc.
│   │   ├── constants.ts              # Engine defaults, schema versions
│   │   ├── id.ts                     # UUID generator and validator
│   │   └── math.ts                   # Vector3, Euler, Matrix4 utilities and matrix multiplications
│   ├── services/
│   │   ├── storage.ts                # IndexedDB wrapper and JSON export/import
│   │   ├── projectManager.ts         # Project lifecycle and business logic
│   │   ├── sceneManager.ts           # Scene lifecycle, GameObject operations, hierarchy checks
│   │   └── transformSystem.ts        # Hierarchy world matrix propagation & cycle prevention
│   ├── store/
│   │   ├── engineStore.ts            # Unified Zustand store combining slices
│   │   └── slices/
│   │       ├── projectSlice.ts
│   │       ├── sceneSlice.ts
│   │       └── editorSlice.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── EditorLayout.tsx      # Main docked layout container
│   │   │   ├── Toolbar.tsx           # Top navigation and action bar
│   │   │   └── StatusBar.tsx         # Bottom status and log readout
│   │   ├── hierarchy/
│   │   │   ├── SceneHierarchy.tsx    # Left panel tree view
│   │   │   └── HierarchyItem.tsx     # Tree node with drag/reparent & context actions
│   │   ├── viewport/
│   │   │   ├── Viewport3D.tsx        # Center R3F canvas
│   │   │   ├── SceneRenderer.tsx     # Three.js meshes and hierarchy renderer
│   │   │   ├── TransformGizmo.tsx    # Drei TransformControls integration
│   │   │   └── ViewportGrid.tsx      # Infinite grid & coordinate axes
│   │   ├── inspector/
│   │   │   ├── Inspector.tsx         # Right panel property editor
│   │   │   ├── TransformFields.tsx   # Position, Rotation, Scale inputs
│   │   │   └── MaterialFields.tsx    # Color, Roughness, Metalness, Wireframe
│   │   ├── console/
│   │   │   └── ConsolePanel.tsx      # Bottom collapsible log console
│   │   └── modals/
│   │       ├── NewProjectModal.tsx
│   │       ├── OpenProjectModal.tsx
│   │       └── SettingsModal.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── unit/
│   │   ├── projectManager.test.ts
│   │   ├── sceneManager.test.ts
│   │   ├── transformSystem.test.ts
│   │   └── storage.test.ts
│   └── integration/
│       └── endToEndWorkflow.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 3. Data Schema Specifications

### Project JSON Schema (v3)
```json
{
  "schemaVersion": 3,
  "id": "uuid-v4-string",
  "name": "MyGameProject",
  "engineVersion": "0.3.0",
  "sceneIds": ["scene-uuid-1"],
  "startupSceneId": "scene-uuid-1",
  "config": {
    "buildTarget": "Web",
    "renderer": {
      "antialias": true,
      "shadows": true,
      "toneMapping": "ACESFilmic",
      "clearColor": "#121316"
    },
    "customSettings": {}
  },
  "createdAt": 1730456000000,
  "updatedAt": 1730456000000
}
```

### Scene JSON Schema (v3)
```json
{
  "schemaVersion": 3,
  "id": "scene-uuid-1",
  "projectId": "uuid-v4-string",
  "name": "MainScene",
  "rootObjectIds": ["obj-1", "obj-2"],
  "gameObjects": {
    "obj-1": {
      "id": "obj-1",
      "name": "PlayerCube",
      "type": "Cube",
      "parentId": null,
      "childIds": ["obj-2"],
      "visible": true,
      "transform": {
        "position": [0, 0.5, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
      },
      "material": {
        "color": "#3b82f6",
        "roughness": 0.4,
        "metalness": 0.1,
        "wireframe": false,
        "opacity": 1.0
      }
    }
  },
  "camera": {
    "position": [5, 5, 5],
    "target": [0, 0, 0],
    "fov": 50
  },
  "environment": {
    "ambientLightColor": "#ffffff",
    "ambientIntensity": 0.6,
    "directionalLightColor": "#ffffff",
    "directionalIntensity": 1.2,
    "directionalPosition": [10, 15, 10]
  }
}
```
