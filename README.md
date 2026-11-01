# EPSTEIN ENGINE — Web 3D Game Engine & Editor (v0.3.0)

[![Tests](https://img.shields.io/badge/tests-21%20passed%2C%200%20failed-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-Web%20Browser%20(WebGL2)-blue.svg)]()
[![Stack](https://img.shields.io/badge/stack-React%2018%20%7C%20TypeScript%20%7C%20Three.js%20%7C%20Zustand-blueviolet.svg)]()

EPSTEIN ENGINE is a client-side, zero-install 3D game engine and scene editor built with React, TypeScript, Three.js (@react-three/fiber, @react-three/drei), and Zustand.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or later (v22 recommended)
- **npm**: v9.0.0 or later

### Installation & Development
```bash
# Install dependencies
npm install

# Run the interactive development server
npm run dev
```
Navigate to `http://localhost:3000` in your web browser.

### Running Tests
```bash
# Run the complete test suite (Unit + Integration)
npm test
```

### Production Build
```bash
# Build the production optimized bundle
npm run build
```

---

## 2. System Architecture

```text
src/
├── core/
│   ├── types.ts          # Core domain models (ProjectData, SceneData, GameObjectData, TransformData, etc.)
│   ├── constants.ts      # Default configurations (Camera, Environment, Materials, Schema v3)
│   ├── id.ts             # RFC4122 v4 UUID generator and validator
│   └── math.ts           # Three.js matrix multiplications, Euler/Quaternion transforms
├── services/
│   ├── storage.ts        # IndexedDB storage provider with memory fallback + JSON import/export
│   ├── projectManager.ts # FR-01–FR-05: Create, Open, Save, Close, Settings configuration
│   ├── sceneManager.ts   # FR-06–FR-11: Create, Load, Save, Add/Remove GameObjects, Transforms
│   └── transformSystem.ts# World transform matrix propagation and hierarchical cycle prevention
├── store/
│   └── engineStore.ts    # Unified Zustand store (Project, Scene, Editor, Undo/Redo)
├── components/
│   ├── layout/
│   │   └── Toolbar.tsx   # Top action bar (File actions, Add Object, Transform modes, Simulation)
│   ├── hierarchy/
│   │   └── SceneHierarchy.tsx # Left tree panel with recursive parenting & visibility toggles
│   ├── viewport/
│   │   └── Viewport3D.tsx# Center interactive Three.js Canvas with R3F & TransformControls gizmos
│   ├── inspector/
│   │   └── Inspector.tsx # Right panel for Position, Rotation, Scale, Hierarchy & Material colors
│   ├── console/
│   │   └── ConsolePanel.tsx   # Bottom collapsible log console
│   └── modals/
│       ├── NewProjectModal.tsx
│       ├── OpenProjectModal.tsx
│       └── SettingsModal.tsx
├── App.tsx               # Main docked editor layout and keyboard shortcut listeners
└── main.tsx              # React DOM mounting
```

---

## 3. Features Implemented

### Module 1: Project Management (FR-01 to FR-05)
- **Create Project (FR-01)**: Generates unique UUID, creates project structure, and initializes default scene.
- **Open Project (FR-02)**: Loads project metadata and its startup scene from IndexedDB.
- **Save Project (FR-03)**: Persists project and active scene into browser storage with ACID transaction semantics.
- **Close Project (FR-04)**: Cleanly resets active project and scene state, unloading viewport memory.
- **Project Settings (FR-05)**: Configures startup scene, build target, antialiasing, shadows, background clear color, and custom key-value settings.
- **Backup & Portability**: Full JSON package Export (`.epstein.json`) and Import via HTML5 File APIs.

### Module 2: Scene Management (FR-06 to FR-11)
- **Create / Load / Save Scene (FR-06 to FR-08)**: Independent scene lifecycle management with schema versioning.
- **Add / Remove GameObjects (FR-09)**: Supports 3D primitives (**Cube, Sphere, Plane, Cylinder, Empty**). Object deletion re-parents children to root to eliminate dangling references.
- **Manage Transforms (FR-10)**: Real-time numeric position, rotation (degrees), and scale editing in Inspector with immediate bidirectional synchronization with the 3D Viewport transform gizmo.
- **Parent-Child Hierarchy (FR-11)**: Arbitrary tree nesting with strict **cycle prevention** (blocks circular ancestor-descendant parenting).
- **Undo / Redo**: 30-step action history stack (`Ctrl+Z`, `Ctrl+Y`).
- **Live Simulation Mode**: Toggle between Edit and Live Simulation playback.

---

## 4. Test Execution Report

Executed via Vitest with JSDOM and IndexedDB mock environment:

```text
 ✓ tests/unit/transformSystem.test.ts (4 tests)
 ✓ tests/unit/sceneManager.test.ts (6 tests)
 ✓ tests/integration/endToEndWorkflow.test.ts (1 test)
 ✓ tests/unit/projectManager.test.ts (7 tests)
 ✓ tests/unit/storage.test.ts (3 tests)

 Test Files  5 passed (5)
      Tests  21 passed (21)
   Duration  22.68s
```

### Traceability Summary
- `TEST-PROJ-01` to `TEST-PROJ-05`: Verifies FR-01 through FR-05 (creation, opening, saving, closing, settings).
- `TEST-SCENE-01` to `TEST-SCENE-06`: Verifies FR-06 through FR-11 (scene persistence, primitive additions, parent deletion orphan protection, transform updates, renaming, visibility).
- `TEST-TRANS-01` to `TEST-TRANS-04`: Verifies direct cycle prevention, deep ancestor cycle prevention, and world matrix multiplication.
- `TEST-STORE-01` to `TEST-STORE-03`: Verifies JSON export/import and malformed JSON resilience.
- `TEST-INT-01`: Verifies the complete 12-step create &rarr; add objects &rarr; transform &rarr; hierarchy &rarr; save &rarr; close &rarr; reopen &rarr; reload &rarr; restore cycle.

---

## 5. Implementation Decisions & Limitations

1. **Storage Subsystem**:
   - Web browsers cannot write directly to arbitrary local disk paths without explicit user file pickers. EPSTEIN ENGINE uses **IndexedDB** for zero-friction local persistence, complemented by **JSON Package Export/Import** for file backup and transfer.
2. **Transform Convention**:
   - Euler angles are stored in degrees for user clarity in the Inspector and converted to radians for Three.js matrix computation (`XYZ` intrinsic Tait-Bryan order).
3. **Orphan Protection on Parent Deletion**:
   - Deleting a parent GameObject does not destroy its children; children are automatically re-parented to the deleted object's parent or promoted to root level.
