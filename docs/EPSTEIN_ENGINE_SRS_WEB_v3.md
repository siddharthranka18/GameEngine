# EPSTEIN ENGINE — Software Requirements Specification (Web Edition)
**Document Version:** 3.0 (Web Architecture)  
**Status:** Approved for Implementation  
**Technology Stack:** React 18+, TypeScript, Three.js, @react-three/fiber, @react-three/drei, Zustand, IndexedDB, Vite  

---

## 1. Introduction and Platform Transformation

EPSTEIN ENGINE was originally conceived as a native C++ desktop 3D game engine. To maximize accessibility, cross-platform compatibility, zero-install onboarding, and cloud/browser ecosystem integration, the engine has been fundamentally re-architected into a **modern browser-based 3D game engine and editor**.

### 1.1 Desktop to Web Architecture Adaptation Rationale

| Requirement Area | Desktop Specification (v2.0) | Web Specification (v3.0) | Technical Rationale |
|---|---|---|---|
| **Runtime Environment** | Windows C++20 Executable | Modern Web Browser (Chrome, Firefox, Safari, Edge) | WebAssembly / JavaScript V8 runtime provides ubiquitous access without native installation. |
| **3D Rendering** | OpenGL 4.5 / Qt | Three.js / WebGL 2.0 via @react-three/fiber | High-performance hardware acceleration in the browser with declarative component lifecycle. |
| **Filesystem / Storage** | `std::filesystem` directory tree (`scenes/`, `project.epstein`) | IndexedDB Browser Storage + HTML5 File API Export/Import | Web security sandbox prohibits arbitrary host disk access. IndexedDB offers structured offline storage; JSON import/export enables host file backup. |
| **State Management** | Raw pointers / `std::unique_ptr` in C++ memory | Zustand Reactive Central Store with normalized state trees | Predictable reactive updates between 3D Viewport, Hierarchy Tree, Inspector, and Console. |
| **File Safety** | `MoveFileExW` atomic replacement | IndexedDB atomic transactions + in-memory validation | IndexedDB transactions guarantee ACID semantics for project and scene saves. |

---

## 2. Functional Requirements

### Module 1: Project Management (FR-01 to FR-05)

- **FR-01: Create Project**  
  - System shall initialize a new Project with a unique UUID, user-defined name, creation timestamp, default scene, and default configuration.
  - System shall persist the new project in IndexedDB.
  - Validation: Project name must be non-empty and alphanumeric/standard characters.

- **FR-02: Open Project**  
  - System shall list stored projects from IndexedDB or allow importing a `.epstein.json` file via browser file upload.
  - System shall validate schema version, project UUID, and scenes before activating.
  - System shall load the project's startup scene into the active viewport.

- **FR-03: Save Project**  
  - System shall serialize project metadata (ID, name, engineVersion, sceneIds, startupSceneId, settings) and write to IndexedDB within an atomic transaction.
  - System shall provide an "Export Project Package" feature generating a downloadable JSON file.

- **FR-04: Close Project**  
  - System shall safely unload the active scene, reset the 3D viewport, clear selection and transform state, and return the editor to the welcome/project management state.
  - System shall prompt the user if unsaved modifications exist.

- **FR-05: Configure Project Settings**  
  - System shall allow configuring: `startupSceneId`, `rendererSettings` (shadows, tone mapping, antialiasing, background color), and `customProperties` (key-value metadata).

---

### Module 2: Scene Management (FR-06 to FR-11)

- **FR-06: Create Scene**  
  - System shall instantiate a new Scene with a unique UUID, name, default camera configuration, default ambient and directional lighting, and an empty root object collection.
  - System shall associate the new scene with the active project's `sceneIds`.

- **FR-07: Load Scene**  
  - System shall retrieve scene data from IndexedDB or JSON file, parse entities and hierarchies, rebuild parent-child relationships, and mount Three.js objects into the React-Three-Fiber scene graph.

- **FR-08: Save Scene**  
  - System shall serialize all GameObjects, transforms, hierarchy relations, camera settings, and lighting parameters into a versioned JSON schema and store in IndexedDB.

- **FR-09: Add / Remove GameObjects**  
  - System shall support adding:
    - Primitives: Cube, Sphere, Plane, Cylinder, Torus
    - Lights: DirectionalLight, PointLight, AmbientLight
    - Empty GameObject (Transform container / grouping node)
  - System shall support removing GameObjects:
    - Orphan or recursively delete child objects based on user action.
    - Clean up all selection and transform gizmo attachments.

- **FR-10: Manage Object Transforms**  
  - Each GameObject shall have a `Transform` containing:
    - `position`: Vector3 (X, Y, Z)
    - `rotation`: Euler angles in degrees or radians (X, Y, Z)
    - `scale`: Vector3 (X, Y, Z)
  - System shall compute local and world matrices consistently: `WorldMatrix = ParentWorldMatrix * LocalMatrix`.
  - Bi-directional sync: Interactive Three.js gizmo manipulations in the Viewport immediately update the Inspector; Inspector numeric edits immediately update the Viewport.

- **FR-11: Parent-Child Hierarchy**  
  - GameObjects shall support arbitrary nesting of parent-child relationships.
  - System shall strictly prevent circular parenting (e.g., node A cannot become child of node B if node B is a descendant of node A).
  - Removing a parent shall re-parent children to root or delete hierarchy cleanly without dangling references.
