# EPSTEIN ENGINE (Web Edition) — System Diagrams & Architecture v3.0

## 1. High-Level Web Architecture Diagram

```mermaid
graph TB
    subgraph UI_Layer ["React UI Layer"]
        TB[Top Toolbar]
        SH[Scene Hierarchy Panel]
        VP[3D Viewport Panel]
        IN[Inspector Panel]
        CP[Console Log Panel]
        MODALS[Project & Settings Modals]
    end

    subgraph State_Layer ["Zustand State Store (Reactive Hub)"]
        PS[Project Slice: activeProject, projectList]
        SS[Scene Slice: activeScene, gameObjects, hierarchy]
        ES[Editor Slice: selectedId, transformMode, camera, logs]
        HS[History Slice: undoStack, redoStack]
    end

    subgraph Three_Layer ["Three.js / React-Three-Fiber Engine"]
        R3F[R3F Canvas]
        SCENE_GRAPH[Three.js Scene Graph]
        GIZMO[TransformControls Drei]
        ORBIT[OrbitControls Drei]
        LIGHTS[Engine Lights & Environment]
        MESHES[Mesh Renderers: Cube, Sphere, Plane, etc.]
    end

    subgraph Service_Layer ["Core Services & Domain Logic"]
        PM[ProjectManager: create, open, save, close]
        SM[SceneManager: create, load, save, addObj, reparent]
        TS[TransformSystem: local/world matrices, propagation]
        HSYS[HierarchySystem: cycle check, orphan handling]
    end

    subgraph Persistence_Layer ["Storage & I/O"]
        IDB[(IndexedDB: epstein_engine_db)]
        SER[Project & Scene JSON Serializers]
        FILE_IO[HTML5 File API: Export/Import .json]
    end

    UI_Layer --> State_Layer
    State_Layer <--> Three_Layer
    State_Layer --> Service_Layer
    Service_Layer --> Persistence_Layer
```

---

## 2. Updated Class Diagram (Web & Domain Model)

```mermaid
classDiagram
    class Project {
        +string id
        +string name
        +string engineVersion
        +string[] sceneIds
        +string startupSceneId
        +ProjectConfig config
        +number createdAt
        +number updatedAt
    }

    class ProjectConfig {
        +string buildTarget
        +RendererSettings renderer
        +Record<string, string> customSettings
    }

    class Scene {
        +string id
        +string name
        +Map<string, GameObject> gameObjects
        +string[] rootObjectIds
        +CameraConfig camera
        +EnvironmentConfig environment
    }

    class GameObject {
        +string id
        +string name
        +string type
        +Transform transform
        +string? parentId
        +string[] childIds
        +boolean visible
        +MaterialConfig material
        +boolean isSelected
    }

    class Transform {
        +Vector3 position
        +Euler rotation
        +Vector3 scale
        +Matrix4x4 localMatrix
        +Matrix4x4 worldMatrix
        +computeLocalMatrix()
        +computeWorldMatrix(parentWorldMatrix)
    }

    class MaterialConfig {
        +string color
        +number roughness
        +number metalness
        +boolean wireframe
        +number opacity
    }

    class ProjectManager {
        -StorageService storage
        +createProject(name) Result~Project~
        +openProject(id) Result~Project~
        +saveProject(project) Result~void~
        +closeProject() Result~void~
        +importProject(jsonString) Result~Project~
        +exportProject(project) string
    }

    class SceneManager {
        -StorageService storage
        +createScene(projectId, name) Scene
        +loadScene(sceneId) Result~Scene~
        +saveScene(scene) Result~void~
        +addGameObject(scene, type, parentId) GameObject
        +removeGameObject(scene, id) Result~void~
        +reparentObject(scene, id, newParentId) Result~void~
    }

    Project "1" *-- "1" ProjectConfig
    Project "1" o-- "many" Scene : references by ID
    Scene "1" *-- "many" GameObject : owns
    GameObject "1" *-- "1" Transform
    GameObject "1" *-- "1" MaterialConfig
    GameObject "1" o-- "many" GameObject : parent/child hierarchy
    ProjectManager ..> Project : manages
    SceneManager ..> Scene : manages
```

---

## 3. Updated Use Case Diagram

```mermaid
graph LR
    User((Game Developer))

    subgraph UC_Project ["Project Management"]
        UC1[UC-01: Create New Project]
        UC2[UC-02: Open Existing Project]
        UC3[UC-03: Save Project Data]
        UC4[UC-04: Close Active Project]
        UC5[UC-05: Configure Project Settings]
        UC6[UC-06: Export Project JSON]
        UC7[UC-07: Import Project JSON]
    end

    subgraph UC_Scene ["Scene & 3D Management"]
        UC8[UC-08: Create New Scene]
        UC9[UC-09: Load Scene into Viewport]
        UC10[UC-10: Save Scene State]
        UC11[UC-11: Add GameObject: Primitive/Light/Empty]
        UC12[UC-12: Delete GameObject]
        UC13[UC-13: Transform Object via Gizmo / Inspector]
        UC14[UC-14: Manage Parent-Child Hierarchy]
        UC15[UC-15: Toggle Simulation Play/Stop Mode]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
```

---

## 4. Updated Sequence Diagram: Hierarchy & Transform Interaction

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant UI as Hierarchy / Viewport UI
    participant Store as Zustand Engine Store
    participant TS as TransformSystem
    participant R3F as Three.js Canvas
    participant DB as IndexedDB Storage

    Dev->>UI: Reparent Object B under Object A
    UI->>Store: reparentObject(childId: "B", newParentId: "A")
    Store->>TS: validateReparent("B", "A") (Cycle Check)
    alt Cycle Detected
        TS-->>Store: Error: Circular hierarchy not allowed
        Store-->>UI: Show Error Toast & Console Log
    else Valid Hierarchy
        TS-->>Store: Validation OK
        Store->>Store: Update parentId and childIds
        Store->>TS: updateWorldTransforms(rootIds)
        TS-->>Store: Updated world matrices
        Store->>R3F: Trigger reactive scene graph re-render
        R3F-->>UI: Viewport visual update
    end

    Dev->>UI: Drag Gizmo to translate Object A
    UI->>Store: updateTransform(id: "A", {position})
    Store->>TS: recomputeHierarchyTransforms("A")
    TS-->>Store: Updated B world position & matrix
    Store->>R3F: Update mesh positions
    Store->>UI: Update Inspector coordinates in real-time

    Dev->>UI: Click "Save Project & Scene"
    UI->>Store: saveCurrentState()
    Store->>DB: putProject() & putScene() in atomic transaction
    DB-->>Store: Success
    Store-->>UI: Display "Saved Successfully" notification
```

---

## 5. Requirement-to-Module-to-Test Traceability Matrix

| Requirement ID | Description | Primary Module / Component | Verification Test ID |
|---|---|---|---|
| **FR-01** | Create Project | `ProjectManager`, `useProjectStore` | `TEST-PROJ-01` |
| **FR-02** | Open Project | `ProjectManager`, `ProjectModal` | `TEST-PROJ-02` |
| **FR-03** | Save Project | `StorageService`, `useProjectStore` | `TEST-PROJ-03` |
| **FR-04** | Close Project | `ProjectManager`, `useProjectStore` | `TEST-PROJ-04` |
| **FR-05** | Configure Settings | `SettingsModal`, `ProjectConfig` | `TEST-PROJ-05` |
| **FR-06** | Create Scene | `SceneManager`, `useSceneStore` | `TEST-SCENE-01` |
| **FR-07** | Load Scene | `SceneManager`, `Viewport3D` | `TEST-SCENE-02` |
| **FR-08** | Save Scene | `SceneManager`, `StorageService` | `TEST-SCENE-03` |
| **FR-09** | Add / Remove GameObjects | `SceneManager`, `SceneHierarchy` | `TEST-SCENE-04` |
| **FR-10** | Manage Transforms | `TransformSystem`, `Inspector`, `Gizmo` | `TEST-SCENE-05` |
| **FR-11** | Parent-Child Hierarchy | `HierarchySystem`, `SceneHierarchy` | `TEST-SCENE-06` |
| **FR-12** | Simulation & Behaviors | `Viewport3D`, `Inspector` | `TEST-SCENE-07` |
| **FR-13** | Real-Time Viewport Profiler | `Viewport3D (MetricsCollector)` | `TEST-INT-02` |
| **EXT-01** | JSON Export / Import | `StorageService`, `Toolbar` | `TEST-INT-01` |
| **INT-01** | Full End-to-End Cycle | `EpsteinEngine Integrated Workflow` | `TEST-INT-02` |
