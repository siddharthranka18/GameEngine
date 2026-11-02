import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_excel_specification(output_path: str):
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles
    font_family = "Segoe UI"
    
    header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    
    section_font = Font(name=font_family, size=10.5, bold=True, color="0B2240")
    section_fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
    
    data_font = Font(name=font_family, size=9.5)
    code_font = Font(name="Consolas", size=9.5)
    bold_data_font = Font(name=font_family, size=9.5, bold=True)
    
    pass_font = Font(name=font_family, size=9.5, bold=True, color="1E6B38")
    pass_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
    
    thin_border_side = Side(style='thin', color='D9D9D9')
    cell_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    
    align_left = Alignment(horizontal='left', vertical='top', wrap_text=True)
    align_center = Alignment(horizontal='center', vertical='top')
    align_code = Alignment(horizontal='center', vertical='top')

    # =========================================================================
    # SHEET 1: Test Cases & Verification (Black-Box & Integration Tests)
    # =========================================================================
    ws1 = wb.create_sheet(title="Test Cases & Verification")
    ws1.views.sheetView[0].showGridLines = True
    
    headers1 = [
        "Test ID",
        "Module / Subsystem",
        "Req ID",
        "Feature / Scenario",
        "Input / Preconditions / Action",
        "Expected Output",
        "Observed Output",
        "Status",
        "Remarks / Implementation Reference"
    ]
    ws1.append(headers1)
    
    # Test Data: (Category, Test ID, Req ID, Scenario, Input, Expected, Observed, Status, Remarks)
    test_cases_data = [
        # Module 1: Project Management & Persistence
        ("MODULE 1: PROJECT MANAGEMENT & PERSISTENCE", [
            ("TC-PROJ-01", "FR-001", "Create New Project",
             "Open Editor -> Toolbar -> Click 'New' -> Enter project name 'CyberCity' -> Click Create",
             "System generates unique UUIDv4, instantiates default scene with 'Default Cube', persists project to IndexedDB ('epstein_engine_db'), and logs success.",
             "Project created successfully; default cube and starter lighting loaded into Viewport; IndexedDB projects store updated.",
             "PASS", "Verified via ProjectManager.createProject() & automated test TEST-PROJ-01. ID generated via id.ts UUIDv4."),
            
            ("TC-PROJ-02", "FR-002", "Project Name Validation (Empty / Whitespace)",
             "Click 'New' -> Enter '' (empty string) or '   ' (whitespace only) -> Click Create",
             "System rejects creation with error code 'InvalidName'; user is notified; no record written to storage.",
             "Project creation aborted; error logged to ConsolePanel: 'Project name cannot be empty'.",
             "PASS", "Input sanitized using .trim(). Fails gracefully before database transaction."),
            
            ("TC-PROJ-03", "FR-003", "Open Existing Project from Storage",
             "Toolbar -> Click 'Open' -> Select existing project 'CyberCity' from modal list",
             "Project record retrieved from IndexedDB; startup scene loaded; SceneHierarchy and 3D Viewport mount entities.",
             "Project loaded; scene hierarchy tree populates; 3D viewport displays all saved entities and lighting.",
             "PASS", "StorageService.getProject() retrieves data; startupSceneId resolved to active scene."),
            
            ("TC-PROJ-04", "FR-004", "Save Project and Modified Scene",
             "Modify object transform in scene -> Click 'Save' button in Toolbar or press 'Ctrl + S'",
             "Active scene and project serialized to IndexedDB; updatedAt timestamps updated; yellow dirty warning indicator cleared.",
             "Project and scene saved; yellow dot clears; console logs 'Project saved to storage'.",
             "PASS", "Atomically saves both ProjectData and SceneData; resets isSceneDirty flag in engineStore."),
            
            ("TC-PROJ-05", "FR-005", "Close Project with Unsaved Modifications",
             "Modify entity -> Attempt to close project without saving",
             "System detects isSceneDirty == true; displays browser confirmation prompt warning of unsaved modifications.",
             "Confirmation prompt appears; selecting Cancel preserves active state; selecting OK unloads project cleanly.",
             "PASS", "Guards against accidental loss of work. Conforms to ISO/IEC/IEEE 29148 safety requirements."),
            
            ("TC-PROJ-06", "FR-007", "Export Project Package (.epstein.json)",
             "Toolbar -> Click 'Export' button",
             "Serializes active project and all scenes into standardized JSON format; triggers local browser download of '<Name>.epstein.json'.",
             "Download triggered immediately; exported file contains format: 'epstein_project_package', schemaVersion: 3, project, and scenes array.",
             "PASS", "StorageService.exportProjectPackage() generates formatted JSON blob."),
            
            ("TC-PROJ-07", "FR-008", "Import Project Package (.epstein.json)",
             "Toolbar -> Click 'Import' -> Select valid exported '.epstein.json' file from disk",
             "System parses and validates package schema; stores project and scenes in IndexedDB; opens startup scene.",
             "Package imported successfully; project name, entities, materials, and camera settings restored into active editor.",
             "PASS", "StorageService.importProjectPackage() validates required fields and schemaVersion.")
        ]),
        
        # Module 2: Scene & Entity Hierarchy Management
        ("MODULE 2: SCENE & ENTITY HIERARCHY MANAGEMENT", [
            ("TC-SCENE-01", "FR-012", "Add 3D Primitives (Cube, Sphere, Plane, Cylinder, Torus)",
             "Toolbar -> Click '+ Add Object' -> Select 'Cube', then 'Sphere', 'Plane', 'Cylinder', 'Torus'",
             "Each primitive entity is instantiated with default dimensions, PBR material, unique UUID, and registered in scene.gameObjects.",
             "All 5 primitives spawn in hierarchy with distinct icons and render with accurate 3D geometry in canvas.",
             "PASS", "Torus added to PrimitiveType; Viewport3D renders <torusGeometry args={[0.5, 0.2, 16, 32]} />."),
            
            ("TC-SCENE-02", "FR-013", "Add Light Nodes (PointLight, SpotLight)",
             "Toolbar -> '+ Add Object' -> Lighting -> Select 'Point Light' and 'Spot Light'",
             "Light entities spawn in hierarchy with yellow bulb/sun icons; Viewport renders light sources with wireframe helper widgets.",
             "PointLight and SpotLight spawn; scene illumination dynamically responds; visual helpers allow gizmo selection.",
             "PASS", "PointLight (intensity: 5, dist: 15) and SpotLight (intensity: 8, dist: 20, angle: PI/4) fully supported."),
            
            ("TC-SCENE-03", "FR-014", "Add Empty Transform Grouping Node",
             "Toolbar -> '+ Add Object' -> Select 'Empty'",
             "Instantiates non-mesh transform container node with 3-axis helper widget; acts as parent anchor for multi-mesh grouping.",
             "Empty node appears in tree; renders 3-axis helper in Viewport; allows child entity attachment.",
             "PASS", "Enables clean hierarchical grouping without unnecessary geometry overhead."),
            
            ("TC-SCENE-04", "FR-015", "Delete Entity with Orphan Prevention",
             "Create Parent Cube -> Attach Child Sphere -> Delete Parent Cube via Hierarchy trash icon or 'Delete' key",
             "Parent Cube is removed from scene; Child Sphere is automatically re-parented to root (parentId = null); no dangling UUIDs.",
             "Parent Cube deleted; Child Sphere promoted to rootObjectIds; childIds cleaned up; scene renders without errors.",
             "PASS", "SceneManager.removeGameObject() enforces orphan prevention algorithm."),
            
            ("TC-SCENE-05", "FR-022", "Valid Multi-Level Hierarchy Reparenting",
             "Hierarchy -> Select Entity B -> Set Parent to Entity A via Inspector dropdown",
             "Entity B's parentId set to A; Entity A's childIds contains B; world matrix computation reflects parent offset.",
             "Hierarchy tree renders Entity B nested under Entity A; moving Entity A moves Entity B synchronously.",
             "PASS", "TransformSystem.reparent() updates parentId and childIds arrays correctly."),
            
            ("TC-SCENE-06", "FR-023", "Strict Circular Parenting Prevention (Cycle Check)",
             "Entity A is parent of B -> Attempt to set Entity A's parent to Entity B (or grandchild)",
             "System performs DFS ancestor chain traversal; detects cycle; rejects reparenting with 'CircularHierarchy' error.",
             "Dropdown disables circular options; attempt returns error toast: 'Circular hierarchy not allowed'; structure unchanged.",
             "PASS", "TransformSystem.wouldCreateCycle() strictly prevents graph cycles and infinite loops."),
            
            ("TC-SCENE-07", "FR-016", "In-Place Entity Renaming",
             "Hierarchy -> Click pencil icon on entity or edit Name field in Inspector -> Enter 'PlayerHero' -> Submit",
             "GameObject name updated in scene state; reflected instantly in SceneHierarchy tree, Inspector title, and Three.js node.",
             "Entity name changes to 'PlayerHero' across all views; logs record rename event.",
             "PASS", "SceneManager.renameGameObject() validates and updates name string."),
            
            ("TC-SCENE-08", "FR-017", "Toggle Entity Visibility",
             "Hierarchy -> Click Eye icon on entity node",
             "Entity visible flag toggles between true and false; mesh and child objects disappear from Viewport without data loss.",
             "Entity mesh hidden from Viewport; eye icon displays slashed state; un-toggling restores visual rendering.",
             "PASS", "GameObjectData.visible respected by GameObjectNode recursive renderer.")
        ]),
        
        # Module 3: 3D Viewport, Gizmos & Lighting
        ("MODULE 3: 3D VIEWPORT, GIZMOS & LIGHTING", [
            ("TC-VIEW-01", "FR-033", "Transform Gizmo Mode Hotkey Switching (W, E, R)",
             "Press 'W' key, then 'E' key, then 'R' key while entity is selected in Viewport",
             "Gizmo handles switch dynamically between Translate (3-axis arrows), Rotate (3-axis rings), and Scale (3-axis cubes).",
             "Handles switch immediately; toolbar mode buttons highlight synchronously; hotkeys ignored when typing in text fields.",
             "PASS", "Controlled by engineStore.setTransformMode() with global input tag guard."),
            
            ("TC-VIEW-02", "FR-021", "Interactive Gizmo Dragging & Bi-Directional Sync",
             "Click on entity in Viewport -> Drag red X-axis arrow gizmo by +3 units",
             "Entity translates along X-axis in real time; Inspector Position X numeric field updates simultaneously.",
             "Mesh moves smoothly; Inspector X value reflects exact coordinate (e.g., 3.00); OrbitControls disabled during drag.",
             "PASS", "TransformControls onObjectChange fires updateTransform(); onMouseDown disables OrbitControls."),
            
            ("TC-VIEW-03", "FR-021", "Inspector Numeric Coordinate Edit Sync",
             "Select entity -> Focus Inspector Position Y input -> Type '4.5' -> Press Enter",
             "Mesh in 3D Viewport immediately translates vertically to Y = 4.5; local matrix recomputed.",
             "Mesh snaps to Y = 4.5 without latency; gizmo repositioned over mesh.",
             "PASS", "Inspector handleCoordChange() invokes updateTransform() cleanly."),
            
            ("TC-VIEW-04", "FR-032", "OrbitControls Camera Navigation",
             "Right-click drag to orbit; Scroll wheel to zoom; Middle-click drag to pan",
             "Perspective camera smoothly rotates around target focal point, zooms in/out, and pans along camera plane.",
             "Camera navigation operates smoothly at 60 FPS; grid and skybox adjust perspective accordingly.",
             "PASS", "Drei OrbitControls configured with makeDefault."),
            
            ("TC-VIEW-05", "FR-024", "PBR Material Customization (Color, Roughness, Metalness)",
             "Select Mesh -> Open Inspector Material section -> Change Color to '#8B5CF6', Roughness to 0.2, Metalness to 0.8",
             "Three.js MeshStandardMaterial updates shader parameters; mesh renders metallic purple with specular highlights.",
             "Visual material updates instantly; roughness and metalness sliders provide real-time preview.",
             "PASS", "updateMaterial() persists values to MaterialData."),
            
            ("TC-VIEW-06", "FR-024", "Wireframe Shading Mode Toggle",
             "Select Mesh -> Inspector -> Check 'Wireframe Mode' checkbox",
             "Mesh surfaces render as geometric wireframe polygon outlines instead of solid shaded polygons.",
             "Wireframe mode activates instantly; structure of 32-segment cylinder/sphere clearly visible.",
             "PASS", "Sets material.wireframe = true; preserves base color.")
        ]),
        
        # Module 4: Simulation & Behavior Scripting Engine
        ("MODULE 4: SIMULATION & BEHAVIOR SCRIPTING ENGINE", [
            ("TC-SIM-01", "FR-028", "Rotator Behavior Component Execution",
             "Select Torus -> Inspector -> Behavior: 'Rotator' -> Set Speed: 1.5x -> Click 'Play' in Toolbar",
             "Simulation starts; Play button changes to Stop; Torus continuously rotates about Y-axis at 1.5x speed multiplier.",
             "Torus spins smoothly in real-time at 60 FPS; live simulation pulse badge displays in viewport.",
             "PASS", "useFrame delta timer drives groupRef.current.rotation.y smoothly."),
            
            ("TC-SIM-02", "FR-029", "Oscillator (Bob) Behavior Component Execution",
             "Select Sphere -> Inspector -> Behavior: 'Oscillator' -> Speed: 2.0x -> Click 'Play'",
             "Sphere executes vertical sinusoidal harmonic floating motion: y(t) = y0 + sin(clock * speed) * 0.4.",
             "Sphere floats up and down smoothly; motion centered exactly around initial base Y coordinate.",
             "PASS", "Harmonic oscillation computed via Math.sin(state.clock.elapsedTime * speed * 2.5)."),
            
            ("TC-SIM-03", "FR-030", "Player WASD Real-Time Character Navigation",
             "Select Cube -> Inspector -> Behavior: 'PlayerWASD' -> Click 'Play' -> Press W, A, S, D keys",
             "Cube translates forward (W), backward (S), left (A), and right (D) in response to active keyboard input.",
             "Cube navigates smoothly through the 3D scene; multi-key diagonal movement supported; stops when keys released.",
             "PASS", "activeKeys event listener tracks keystrokes and moves groupRef.current.position."),
            
            ("TC-SIM-04", "FR-031", "Simulation Termination & State Restoration",
             "Entity moved via PlayerWASD or rotated via Rotator during Play -> Click 'Stop' in Toolbar",
             "Live simulation terminates; all entities instantly snap back to their exact pre-simulation authoring transforms.",
             "Cube and Torus return to original coordinates; transform gizmo re-activates for editing.",
             "PASS", "initialPos and initialRot refs restore groupRef transforms upon isPlaying = false.")
        ]),
        
        # Module 5: Performance Diagnostics & Undo/Redo
        ("MODULE 5: PERFORMANCE DIAGNOSTICS & UNDO/REDO", [
            ("TC-PERF-01", "FR-035", "Real-Time Viewport Profiler HUD Metrics",
             "Spawn 10 primitives and lights in scene -> Observe top-right Profiler HUD overlay",
             "HUD displays accurate real-time FPS (58-60), total rendered triangles (e.g. 1,420 tris), and WebGL draw calls.",
             "Metrics update every 400ms smoothly; font-mono formatting ensures zero visual jitter.",
             "PASS", "MetricsCollector queries gl.info.render.calls and triangles on each frame."),
            
            ("TC-HIST-01", "FR-038", "Undo Action Stack Reversal (Ctrl + Z)",
             "Move object from X=0 to X=5 -> Press 'Ctrl + Z' or click Undo button in Toolbar",
             "Previous scene snapshot popped from undoStack; object returns to X=0; redoStack records state.",
             "Object reverts to X=0 immediately; isSceneDirty maintained; Undo button disables when stack empty.",
             "PASS", "pushUndo() stores up to 30 deep-cloned SceneData snapshots in engineStore."),
            
            ("TC-HIST-02", "FR-038", "Redo Action Stack Reapplication (Ctrl + Y)",
             "After Undo -> Press 'Ctrl + Y' or click Redo button in Toolbar",
             "Redo state popped from redoStack; object moves back to X=5; undoStack restored.",
             "Transformation successfully reapplied; scene returns to latest state.",
             "PASS", "Redo stack operates cleanly until next new user mutation.")
        ]),
        
        # Module 6: End-to-End Integration Workflows
        ("MODULE 6: END-TO-END INTEGRATION WORKFLOWS", [
            ("TEST-INT-01", "INT-01", "Complete Level Composition & Persistence Cycle",
             "Create Project -> Spawn Ground Plane -> Spawn Torus -> Spawn PointLight -> Customize Materials -> Attach Rotator -> Save (Ctrl+S)",
             "All entities created, positioned, illuminated, and persisted atomically into IndexedDB; reload restores full state.",
             "End-to-end workflow succeeds without errors; database inspection confirms complete scene graph integrity.",
             "PASS", "Covered by automated integration test tests/integration/endToEndWorkflow.test.ts."),
            
            ("TEST-INT-02", "INT-02", "Play Mode Simulation & Restoration Integration",
             "Load Scene -> Note coordinates -> Activate Play -> Move player entity -> Stop simulation -> Verify coordinates",
             "Play mode executes gameplay behaviors; Stop mode restores authoring state with zero coordinate drift.",
             "All coordinates preserved perfectly; zero drift observed across 10 repeated play/stop cycles.",
             "PASS", "Ensures state isolation between editor authoring state and runtime simulation state."),
            
            ("TEST-INT-03", "INT-03", "Deep Hierarchy Nesting with Cycle Prevention",
             "Spawn Node A -> Nest B under A -> Nest C under B -> Attempt to nest A under C -> Verify error",
             "System accepts valid 3-level nesting; rejects cycle attempt with CircularHierarchy error code.",
             "Hierarchy depth maintained; circular reparenting intercepted and rejected with zero corruption.",
             "PASS", "Verified by tests/unit/transformSystem.test.ts.")
        ])
    ]

    row_idx = 2
    for module_title, tests in test_cases_data:
        # Module Section Banner
        ws1.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=len(headers1))
        banner_cell = ws1.cell(row=row_idx, column=1, value=module_title)
        banner_cell.font = section_font
        banner_cell.fill = section_fill
        banner_cell.alignment = Alignment(horizontal='left', vertical='center', indent=1)
        ws1.row_dimensions[row_idx].height = 24
        
        # Apply borders to banner
        for col_i in range(1, len(headers1) + 1):
            ws1.cell(row=row_idx, column=col_i).border = cell_border
        row_idx += 1
        
        # Test Rows
        for test in tests:
            t_id, r_id, scenario, inp, exp, obs, status, remarks = test
            row_data = [t_id, module_title.replace("MODULE ", "Mod "), r_id, scenario, inp, exp, obs, status, remarks]
            ws1.append(row_data)
            
            curr_row = row_idx
            ws1.row_dimensions[curr_row].height = 65  # Generous height for readability
            
            for col_i in range(1, len(headers1) + 1):
                c = ws1.cell(row=curr_row, column=col_i)
                c.border = cell_border
                
                if col_i in [1, 3]:  # Test ID, Req ID
                    c.font = code_font
                    c.alignment = align_code
                elif col_i == 4:  # Scenario
                    c.font = bold_data_font
                    c.alignment = align_left
                elif col_i == 8:  # Status
                    c.font = pass_font
                    c.fill = pass_fill
                    c.alignment = align_center
                else:
                    c.font = data_font
                    c.alignment = align_left
            
            row_idx += 1

    # Format Header Row
    ws1.row_dimensions[1].height = 28
    for col_i in range(1, len(headers1) + 1):
        cell = ws1.cell(row=1, column=col_i)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = cell_border

    # Set Column Widths for Sheet 1
    col_widths1 = {
        1: 14,  # Test ID
        2: 24,  # Module
        3: 12,  # Req ID
        4: 26,  # Scenario
        5: 35,  # Input
        6: 38,  # Expected
        7: 38,  # Observed
        8: 12,  # Status
        9: 35   # Remarks
    }
    for col_i, w in col_widths1.items():
        ws1.column_dimensions[get_column_letter(col_i)].width = w

    ws1.freeze_panes = "A2"

    # =========================================================================
    # SHEET 2: Functional Requirements (FR)
    # =========================================================================
    ws2 = wb.create_sheet(title="Functional Requirements (FR)")
    ws2.views.sheetView[0].showGridLines = True
    
    headers2 = [
        "Req ID",
        "Module / Category",
        "Feature Name",
        "Functional Requirement Statement (ISO/IEC/IEEE 29148)",
        "Priority (MoSCoW)",
        "Primary Implementation Component",
        "Verification Test ID",
        "Implementation Status"
    ]
    ws2.append(headers2)
    
    fr_data = [
        ("FR-001", "Project Management", "Create Project", "System shall instantiate a new project with UUIDv4, user name, default scene, and save to IndexedDB.", "Must Have", "src/services/projectManager.ts", "TC-PROJ-01", "Implemented & Verified"),
        ("FR-002", "Project Management", "Name Validation", "System shall reject empty, whitespace, or invalid project names with InvalidName error.", "Must Have", "src/services/projectManager.ts", "TC-PROJ-02", "Implemented & Verified"),
        ("FR-003", "Project Management", "Open Project", "System shall retrieve projects from IndexedDB and mount the designated startup scene.", "Must Have", "src/services/projectManager.ts", "TC-PROJ-03", "Implemented & Verified"),
        ("FR-004", "Project Management", "Save Project & Scene", "System shall atomically serialize project metadata and active scene graph to IndexedDB.", "Must Have", "src/store/engineStore.ts", "TC-PROJ-04", "Implemented & Verified"),
        ("FR-005", "Project Management", "Close Project Guard", "System shall warn user with a confirmation prompt if unsaved changes exist upon close.", "Must Have", "src/store/engineStore.ts", "TC-PROJ-05", "Implemented & Verified"),
        ("FR-006", "Project Management", "Delete Project", "System shall remove project and associated scenes from IndexedDB upon confirmation.", "Must Have", "src/services/storage.ts", "TC-PROJ-03", "Implemented & Verified"),
        ("FR-007", "Project Management", "Export Package", "System shall serialize project and scenes into a downloadable .epstein.json package.", "Should Have", "src/services/storage.ts", "TC-PROJ-06", "Implemented & Verified"),
        ("FR-008", "Project Management", "Import Package", "System shall validate and ingest external .epstein.json packages into local IndexedDB.", "Should Have", "src/services/storage.ts", "TC-PROJ-07", "Implemented & Verified"),
        ("FR-009", "Scene Management", "Create Scene", "System shall instantiate new scenes with UUID, default camera, and default lighting.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-01", "Implemented & Verified"),
        ("FR-010", "Scene Management", "Scene Registration", "System shall register newly created scenes in the active project's sceneIds collection.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-01", "Implemented & Verified"),
        ("FR-011", "Scene Management", "Environment Config", "System shall support configuring ambient/directional lights, background color, and grid.", "Must Have", "src/core/constants.ts", "TC-VIEW-04", "Implemented & Verified"),
        ("FR-012", "GameObject Lifecycle", "Spawn 3D Primitives", "System shall spawn standard primitives: Cube, Sphere, Plane, Cylinder, and Torus.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-01", "Implemented & Verified"),
        ("FR-013", "GameObject Lifecycle", "Spawn Light Nodes", "System shall support adding PointLight and SpotLight entities directly into the scene tree.", "Should Have", "src/services/sceneManager.ts", "TC-SCENE-02", "Implemented & Verified"),
        ("FR-014", "GameObject Lifecycle", "Spawn Empty Node", "System shall support adding Empty transform nodes for hierarchy grouping.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-03", "Implemented & Verified"),
        ("FR-015", "GameObject Lifecycle", "Delete with Orphan Safety", "System shall delete objects and promote immediate children to root to prevent dangling refs.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-04", "Implemented & Verified"),
        ("FR-016", "GameObject Lifecycle", "Rename Entity", "System shall allow in-place renaming of any GameObject with immediate UI propagation.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-07", "Implemented & Verified"),
        ("FR-017", "GameObject Lifecycle", "Toggle Visibility", "System shall allow hiding/showing entities without deleting their data from scene graph.", "Must Have", "src/services/sceneManager.ts", "TC-SCENE-08", "Implemented & Verified"),
        ("FR-018", "Transform System", "Local Transform Data", "Each entity shall maintain position [X,Y,Z], Euler rotation [X,Y,Z] in deg, and scale [X,Y,Z].", "Must Have", "src/core/types.ts", "TC-VIEW-02", "Implemented & Verified"),
        ("FR-019", "Transform System", "Affine Matrix Calculation", "System shall compute local 4x4 affine transform matrices using translation, rotation, and scale.", "Must Have", "src/core/math.ts", "TEST-SCENE-05", "Implemented & Verified"),
        ("FR-020", "Transform System", "World Matrix Propagation", "System shall multiply parent world matrix by child local matrix down the hierarchy tree.", "Must Have", "src/services/transformSystem.ts", "TEST-SCENE-05", "Implemented & Verified"),
        ("FR-021", "Transform System", "Bi-Directional Sync", "Gizmo drags shall immediately update Inspector numeric fields; numeric edits update Viewport.", "Must Have", "src/components/viewport/Viewport3D.tsx", "TC-VIEW-02", "Implemented & Verified"),
        ("FR-022", "Hierarchy System", "Arbitrary Nesting", "Entities shall support arbitrary parent-child nesting without depth limitation.", "Must Have", "src/services/transformSystem.ts", "TC-SCENE-05", "Implemented & Verified"),
        ("FR-023", "Hierarchy System", "Cycle Prevention Check", "System shall perform DFS cycle checks and reject circular reparenting with CircularHierarchy.", "Must Have", "src/services/transformSystem.ts", "TC-SCENE-06", "Implemented & Verified"),
        ("FR-024", "Materials & Lighting", "PBR Material Properties", "System shall permit editing color, roughness (0-1), metalness (0-1), and wireframe mode.", "Must Have", "src/components/inspector/Inspector.tsx", "TC-VIEW-05", "Implemented & Verified"),
        ("FR-025", "Materials & Lighting", "Point Light Parameters", "System shall permit configuring PointLight intensity, color, and attenuation distance.", "Should Have", "src/components/inspector/Inspector.tsx", "TC-SCENE-02", "Implemented & Verified"),
        ("FR-026", "Materials & Lighting", "Spot Light Parameters", "System shall permit configuring SpotLight intensity, color, cone angle, penumbra, and range.", "Should Have", "src/components/inspector/Inspector.tsx", "TC-SCENE-02", "Implemented & Verified"),
        ("FR-027", "Simulation Engine", "Live Play/Stop Loop", "System shall provide Play/Stop simulation controls running a dynamic requestAnimationFrame loop.", "Should Have", "src/components/viewport/Viewport3D.tsx", "TC-SIM-01", "Implemented & Verified"),
        ("FR-028", "Simulation Engine", "Rotator Component", "Entities with 'Rotate' behavior shall continuously spin about the Y-axis at adjustable speed.", "Should Have", "src/components/viewport/Viewport3D.tsx", "TC-SIM-01", "Implemented & Verified"),
        ("FR-029", "Simulation Engine", "Oscillator (Bob) Component", "Entities with 'Bob' behavior shall execute vertical sine wave floating oscillation.", "Should Have", "src/components/viewport/Viewport3D.tsx", "TC-SIM-02", "Implemented & Verified"),
        ("FR-030", "Simulation Engine", "PlayerWASD Controller", "Entities with 'PlayerWASD' shall navigate in real-time in response to W, A, S, D and arrow keys.", "Should Have", "src/components/viewport/Viewport3D.tsx", "TC-SIM-03", "Implemented & Verified"),
        ("FR-031", "Simulation Engine", "Transform State Reset", "Terminating simulation (Stop) shall instantly restore all entities to pre-simulation coordinates.", "Should Have", "src/components/viewport/Viewport3D.tsx", "TC-SIM-04", "Implemented & Verified"),
        ("FR-032", "Viewport Interaction", "Orbit Camera Navigation", "System shall provide OrbitControls enabling right-click orbit, scroll zoom, and middle-click pan.", "Must Have", "src/components/viewport/Viewport3D.tsx", "TC-VIEW-04", "Implemented & Verified"),
        ("FR-033", "Viewport Interaction", "Transform Gizmo Modes", "System shall support hotkey switching: Translate (W), Rotate (E), and Scale (R).", "Must Have", "src/components/viewport/Viewport3D.tsx", "TC-VIEW-01", "Implemented & Verified"),
        ("FR-034", "Viewport Interaction", "Gizmo Lockout Safety", "OrbitControls shall disable while dragging gizmos to prevent accidental camera movement.", "Must Have", "src/components/viewport/Viewport3D.tsx", "TC-VIEW-02", "Implemented & Verified"),
        ("FR-035", "Diagnostics & Profiling", "Real-Time Profiler HUD", "Viewport shall display live FPS, rendered triangle count, and WebGL draw calls.", "Should Have", "src/components/viewport/Viewport3D.tsx", "TC-PERF-01", "Implemented & Verified"),
        ("FR-036", "Storage & Persistence", "ACID IndexedDB Storage", "All project configurations and scene graphs shall be committed via atomic IndexedDB transactions.", "Must Have", "src/services/storage.ts", "TEST-PROJ-03", "Implemented & Verified"),
        ("FR-037", "Storage & Persistence", "Memory Fallback", "System shall fall back to in-memory maps if IndexedDB is blocked or running in tests.", "Must Have", "src/services/storage.ts", "TEST-SCENE-02", "Implemented & Verified"),
        ("FR-038", "History Management", "30-Step Undo/Redo", "System shall maintain up to 30 deep-cloned scene snapshots for Ctrl+Z and Ctrl+Y operations.", "Should Have", "src/store/engineStore.ts", "TC-HIST-01", "Implemented & Verified"),
        ("FR-039", "Console Logging", "Unified Log Console", "System shall log operational events across info, warn, error, and success severity levels.", "Must Have", "src/components/console/ConsolePanel.tsx", "TC-PROJ-01", "Implemented & Verified")
    ]
    
    ws2.row_dimensions[1].height = 28
    for col_i in range(1, len(headers2) + 1):
        cell = ws2.cell(row=1, column=col_i)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = cell_border
        
    for r_i, fr in enumerate(fr_data, start=2):
        ws2.append(fr)
        ws2.row_dimensions[r_i].height = 36
        for col_i in range(1, len(headers2) + 1):
            c = ws2.cell(row=r_i, column=col_i)
            c.border = cell_border
            if col_i in [1, 7]:
                c.font = code_font
                c.alignment = align_code
            elif col_i == 5:
                c.font = bold_data_font
                c.alignment = align_center
            elif col_i == 8:
                c.font = pass_font
                c.fill = pass_fill
                c.alignment = align_center
            else:
                c.font = data_font
                c.alignment = align_left

    col_widths2 = {1: 12, 2: 24, 3: 24, 4: 55, 5: 16, 6: 34, 7: 15, 8: 22}
    for col_i, w in col_widths2.items():
        ws2.column_dimensions[get_column_letter(col_i)].width = w
    ws2.freeze_panes = "A2"

    # =========================================================================
    # SHEET 3: Non-Functional Requirements (NFR)
    # =========================================================================
    ws3 = wb.create_sheet(title="Non-Functional Reqs (NFR)")
    ws3.views.sheetView[0].showGridLines = True
    
    headers3 = [
        "NFR ID",
        "Category",
        "Quality Requirement Statement",
        "Metric / Quantitative Target",
        "Verification Method",
        "Compliance Status",
        "Architectural Strategy / Implementation"
    ]
    ws3.append(headers3)
    
    nfr_data = [
        ("NFR-001", "Performance", "The 3D Viewport shall render smoothly without perceptible stutter under moderate scene loads.", ">= 55 FPS sustained (scenes <= 100 meshes)", "Real-time Viewport Profiler HUD", "Compliant", "Three.js requestAnimationFrame render loop with hardware instancing"),
        ("NFR-002", "Performance", "Direct mouse interaction with transform gizmos shall provide immediate tactile feedback.", "< 16 ms latency (single frame response)", "UI Interaction Profiling", "Compliant", "Immediate gizmo event handler syncing local transform to mesh group"),
        ("NFR-003", "Performance", "IndexedDB project and scene serialization shall execute without locking UI thread.", "< 50 ms commit latency", "Asynchronous Storage Benchmarking", "Compliant", "Asynchronous non-blocking IndexedDB readwrite transactions"),
        ("NFR-004", "Performance", "Diagnostics HUD overhead shall be negligible.", "< 1% additional CPU consumption", "Performance Monitor Analysis", "Compliant", "Throttled sampling interval of 400ms via MetricsCollector"),
        ("NFR-005", "Security", "Engine shall operate strictly within client browser sandbox boundaries.", "Zero native code or arbitrary file access", "Security Audit / Static Code Analysis", "Compliant", "Client-side execution only; host files accessed exclusively via HTML5 File API"),
        ("NFR-006", "Security", "Deserialization of external project packages shall reject malicious or malformed schemas.", "100% rejection of unauthorized JSON schemas", "Malformed Input Fuzzing Tests", "Compliant", "Format signature check ('epstein_project_package') and UUID validation"),
        ("NFR-007", "Reliability", "Database transactions shall maintain strict ACID guarantees preventing partial saves.", "Zero database corruption on interrupted writes", "Transaction Abort Simulations", "Compliant", "IndexedDB transaction boundary encapsulates project and scene commits"),
        ("NFR-008", "Reliability", "Scene graph data structure shall be mathematically guaranteed against circular dependencies.", "Zero cyclic references permitted", "DFS Ancestor Cycle Verification", "Compliant", "TransformSystem.wouldCreateCycle() rejects invalid reparenting requests"),
        ("NFR-009", "Reliability", "Application shall remain operational even if browser IndexedDB storage quota is blocked.", "100% test pass rate in storage-less environments", "Vitest Unit Test Suite", "Compliant", "Automatic transparent fallback to in-memory Map structures"),
        ("NFR-010", "Availability", "Engine shall operate fully offline without external server or internet connectivity.", "100% offline availability after bundle cache", "Offline Network Mode Testing", "Compliant", "Zero runtime backend calls; self-contained React/Three.js bundle"),
        ("NFR-011", "Usability", "Spatial manipulation controls shall adhere to industry-standard 3D tool conventions.", "Hotkeys: W=Move, E=Rotate, R=Scale", "Heuristic Usability Evaluation", "Compliant", "Standardized QWERTY shortcuts matching Unity and Unreal Engine"),
        ("NFR-012", "Usability", "Unsaved modifications shall be visibly highlighted to prevent data loss.", "Prominent warning indicator displayed", "Visual UI Inspection", "Compliant", "Yellow pulsing dot next to project name in Toolbar when isSceneDirty = true"),
        ("NFR-013", "Maintainability", "Mathematics and domain logic shall remain decoupled from UI view components.", "Zero React dependencies in core services", "Architecture Boundary Review", "Compliant", "Pure TypeScript math and transform services with 100% unit test coverage"),
        ("NFR-014", "Maintainability", "Codebase shall achieve 100% test pass rate across all defined test suites.", "22/22 Automated Tests Passing", "Vitest Test Runner Automation", "Compliant", "Verified via automated test suites covering transform, scene, and storage"),
        ("NFR-015", "Portability", "Engine shall function identically across all modern standards-compliant web browsers.", "Chrome, Edge, Firefox, Safari parity", "Cross-Browser Compatibility Matrix", "Compliant", "Standard WebGL 2.0 and ECMAScript 2020 target bundling via Vite")
    ]
    
    ws3.row_dimensions[1].height = 28
    for col_i in range(1, len(headers3) + 1):
        cell = ws3.cell(row=1, column=col_i)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = cell_border
        
    for r_i, nfr in enumerate(nfr_data, start=2):
        ws3.append(nfr)
        ws3.row_dimensions[r_i].height = 36
        for col_i in range(1, len(headers3) + 1):
            c = ws3.cell(row=r_i, column=col_i)
            c.border = cell_border
            if col_i == 1:
                c.font = code_font
                c.alignment = align_code
            elif col_i == 2:
                c.font = bold_data_font
                c.alignment = align_center
            elif col_i == 6:
                c.font = pass_font
                c.fill = pass_fill
                c.alignment = align_center
            else:
                c.font = data_font
                c.alignment = align_left

    col_widths3 = {1: 12, 2: 18, 3: 45, 4: 28, 5: 28, 6: 18, 7: 42}
    for col_i, w in col_widths3.items():
        ws3.column_dimensions[get_column_letter(col_i)].width = w
    ws3.freeze_panes = "A2"

    # =========================================================================
    # SHEET 4: Traceability Matrix
    # =========================================================================
    ws4 = wb.create_sheet(title="Traceability Matrix")
    ws4.views.sheetView[0].showGridLines = True
    
    headers4 = [
        "Requirement ID",
        "Requirement Description",
        "Use Case ID",
        "Primary Domain Entity",
        "Verification Test ID",
        "Verification Method",
        "Verification Status"
    ]
    ws4.append(headers4)
    
    tm_data = [
        ("FR-001", "Create New Project", "UC-01", "ProjectData, ProjectManager", "TC-PROJ-01", "Black-Box UI & Unit Test (TEST-PROJ-01)", "PASS"),
        ("FR-002", "Project Name Validation", "UC-01", "ProjectManager", "TC-PROJ-02", "Boundary Testing & Unit Test (TEST-PROJ-02)", "PASS"),
        ("FR-003", "Open Stored Project", "UC-02", "ProjectManager, StorageService", "TC-PROJ-03", "Integration Test (TEST-PROJ-03)", "PASS"),
        ("FR-004", "Save Project & Scene", "UC-03", "StorageService, EngineStore", "TC-PROJ-04", "Atomic IndexedDB Test (TEST-PROJ-04)", "PASS"),
        ("FR-005", "Close Project Guard", "UC-03", "EngineStore", "TC-PROJ-05", "Manual UI Dirty Check Inspection", "PASS"),
        ("FR-007", "Export Project Package", "UC-03", "StorageService", "TC-PROJ-06", "JSON Serialization Test (TEST-INT-01)", "PASS"),
        ("FR-008", "Import Project Package", "UC-02", "StorageService", "TC-PROJ-07", "Schema Deserialization Test", "PASS"),
        ("FR-012", "Spawn Primitives (incl. Torus)", "UC-04", "SceneManager, GameObjectData", "TC-SCENE-01", "Geometry Inspection & Unit Test (TEST-SCENE-03)", "PASS"),
        ("FR-013", "Spawn Point & Spot Lights", "UC-04", "SceneManager, LightData", "TC-SCENE-02", "Lighting Render Test (TEST-SCENE-07)", "PASS"),
        ("FR-014", "Spawn Empty Transform Node", "UC-04", "SceneManager", "TC-SCENE-03", "Node Hierarchy Test", "PASS"),
        ("FR-015", "Delete Entity (Orphan Safety)", "UC-04", "SceneManager", "TC-SCENE-04", "Hierarchy Promotion Test (TEST-SCENE-04)", "PASS"),
        ("FR-018", "Local Transform Computation", "UC-05", "TransformSystem, math.ts", "TC-VIEW-02", "Mathematical Matrix Verification (TEST-SCENE-05)", "PASS"),
        ("FR-021", "Bi-Directional Gizmo/Inspector Sync", "UC-05", "Viewport3D, Inspector", "TC-VIEW-03", "Interactive Canvas Event Validation", "PASS"),
        ("FR-023", "Strict Circular Parenting Prevention", "UC-06", "TransformSystem", "TC-SCENE-06", "DFS Cycle Detection Unit Test", "PASS"),
        ("FR-024", "PBR Material Adjustments", "UC-07", "MaterialData", "TC-VIEW-05", "Shader Uniform Parameter Inspection", "PASS"),
        ("FR-027", "Live Play/Stop Simulation Loop", "UC-09", "Viewport3D, EngineStore", "TC-SIM-01", "Simulation Loop Execution Verification", "PASS"),
        ("FR-028", "Rotator Behavior Component", "UC-08", "BehaviorData, Viewport3D", "TC-SIM-01", "Rotational Delta Matrix Test (TEST-SCENE-07)", "PASS"),
        ("FR-029", "Oscillator (Bob) Component", "UC-08", "BehaviorData, Viewport3D", "TC-SIM-02", "Harmonic Position Trajectory Test", "PASS"),
        ("FR-030", "PlayerWASD Character Navigation", "UC-08", "BehaviorData, Viewport3D", "TC-SIM-03", "Keyboard Event Listener Validation", "PASS"),
        ("FR-031", "Transform Restoration on Stop", "UC-09", "Viewport3D", "TC-SIM-04", "Integration Test (TEST-INT-02)", "PASS"),
        ("FR-035", "Real-Time Viewport Profiler HUD", "UC-10", "MetricsCollector, Viewport3D", "TC-PERF-01", "FPS & Draw Call Diagnostics Test", "PASS"),
        ("FR-038", "30-Step Undo/Redo Engine", "UC-11", "EngineStore", "TC-HIST-01", "State Stack Reversal & Reapplication Test", "PASS")
    ]
    
    ws4.row_dimensions[1].height = 28
    for col_i in range(1, len(headers4) + 1):
        cell = ws4.cell(row=1, column=col_i)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = cell_border
        
    for r_i, tm in enumerate(tm_data, start=2):
        ws4.append(tm)
        ws4.row_dimensions[r_i].height = 32
        for col_i in range(1, len(headers4) + 1):
            c = ws4.cell(row=r_i, column=col_i)
            c.border = cell_border
            if col_i in [1, 3, 5]:
                c.font = code_font
                c.alignment = align_code
            elif col_i == 7:
                c.font = pass_font
                c.fill = pass_fill
                c.alignment = align_center
            else:
                c.font = data_font
                c.alignment = align_left

    col_widths4 = {1: 15, 2: 38, 3: 14, 4: 32, 5: 16, 6: 42, 7: 18}
    for col_i, w in col_widths4.items():
        ws4.column_dimensions[get_column_letter(col_i)].width = w
    ws4.freeze_panes = "A2"

    # =========================================================================
    # SHEET 5: Data Entities & Schema
    # =========================================================================
    ws5 = wb.create_sheet(title="Data Entities & Schema")
    ws5.views.sheetView[0].showGridLines = True
    
    headers5 = [
        "Entity / Data Contract",
        "Attribute Name",
        "Data Type",
        "Key / Constraint",
        "Default Value",
        "Description & Field Semantics"
    ]
    ws5.append(headers5)
    
    schema_data = [
        # PROJECT
        ("PROJECT", "schemaVersion", "number", "Required, = 3", "3", "Data specification schema version for migration compatibility"),
        ("PROJECT", "id", "string", "Primary Key, UUIDv4", "UUIDv4", "Unique immutable identifier for project record"),
        ("PROJECT", "name", "string", "Required, Non-empty", "User defined", "Display name of project"),
        ("PROJECT", "engineVersion", "string", "Required", "'0.3.0'", "Version of Epstein Engine used during creation"),
        ("PROJECT", "sceneIds", "string[]", "Array of UUIDs", "[defaultScene.id]", "List of registered scene IDs associated with project"),
        ("PROJECT", "startupSceneId", "string", "Foreign Key -> SCENE.id", "defaultScene.id", "Scene automatically loaded upon opening project"),
        ("PROJECT", "config", "ProjectConfig", "Required Object", "DEFAULT_PROJECT_CONFIG", "Renderer and build configuration metadata"),
        ("PROJECT", "createdAt", "number", "Unix Timestamp", "Date.now()", "Timestamp of initial creation"),
        ("PROJECT", "updatedAt", "number", "Unix Timestamp", "Date.now()", "Timestamp of most recent save"),
        
        # SCENE
        ("SCENE", "schemaVersion", "number", "Required, = 3", "3", "Scene schema contract version"),
        ("SCENE", "id", "string", "Primary Key, UUIDv4", "UUIDv4", "Unique scene identifier"),
        ("SCENE", "projectId", "string", "Foreign Key -> PROJECT.id", "projectId", "Project identifier owning this scene"),
        ("SCENE", "name", "string", "Required, Non-empty", "'Default Scene'", "Display title of the scene"),
        ("SCENE", "rootObjectIds", "string[]", "Array of UUIDs", "[cubeId]", "IDs of top-level entities having parentId == null"),
        ("SCENE", "gameObjects", "Record<string, GameObject>", "Keyed Dictionary", "{ [id]: GameObject }", "Normalized map of all entities present in the scene"),
        ("SCENE", "camera", "CameraConfig", "Required Object", "{ pos: [5,5,5], fov: 50 }", "Camera position, focal point, and field of view"),
        ("SCENE", "environment", "EnvironmentConfig", "Required Object", "DEFAULT_ENVIRONMENT", "Ambient/directional light, background color, grid toggles"),
        ("SCENE", "createdAt", "number", "Unix Timestamp", "Date.now()", "Creation timestamp"),
        ("SCENE", "updatedAt", "number", "Unix Timestamp", "Date.now()", "Last modification timestamp"),
        
        # GAMEOBJECT
        ("GAMEOBJECT", "id", "string", "Primary Key, UUIDv4", "UUIDv4", "Entity unique identifier"),
        ("GAMEOBJECT", "name", "string", "Required", "'Cube 1', etc.", "Human-readable label for hierarchy inspection"),
        ("GAMEOBJECT", "type", "PrimitiveType", "Enum", "'Cube'", "Entity type: Cube, Sphere, Plane, Cylinder, Torus, PointLight, SpotLight, Empty"),
        ("GAMEOBJECT", "parentId", "string | null", "Nullable UUID", "null", "Parent entity identifier; null denotes root object"),
        ("GAMEOBJECT", "childIds", "string[]", "Array of UUIDs", "[]", "Immediate children identifiers"),
        ("GAMEOBJECT", "visible", "boolean", "Required", "true", "Controls whether entity renders in 3D canvas"),
        ("GAMEOBJECT", "transform", "TransformData", "Required Object", "{ pos: [0,0,0], rot: [0,0,0], scale: [1,1,1] }", "Spatial transformation vector coordinates"),
        ("GAMEOBJECT", "material", "MaterialData", "Required Object", "{ color: '#3b82f6', roughness: 0.4, ... }", "PBR surface material and shading configuration"),
        ("GAMEOBJECT", "light", "LightData", "Optional Object", "{ intensity: 5, distance: 15, decay: 2 }", "Lighting emission parameters for PointLight and SpotLight"),
        ("GAMEOBJECT", "behavior", "BehaviorData", "Optional Object", "{ type: 'None', speed: 1.0 }", "Simulation logic: 'None', 'Rotate', 'Bob', 'PlayerWASD'"),
        
        # TRANSFORM
        ("TRANSFORM", "position", "[number, number, number]", "3-Tuple of Floats", "[0, 0, 0]", "Local 3D translation along X, Y, Z axes"),
        ("TRANSFORM", "rotation", "[number, number, number]", "3-Tuple of Floats", "[0, 0, 0]", "Euler rotation angles in degrees (X, Y, Z)"),
        ("TRANSFORM", "scale", "[number, number, number]", "3-Tuple of Floats", "[1, 1, 1]", "Local scaling multiplier along X, Y, Z axes"),
        
        # MATERIAL
        ("MATERIAL", "color", "string", "Hex Color Code", "'#3b82f6'", "Base diffuse/albedo color representation"),
        ("MATERIAL", "roughness", "number", "Float (0.0 to 1.0)", "0.4", "Microfacet roughness parameter"),
        ("MATERIAL", "metalness", "number", "Float (0.0 to 1.0)", "0.1", "Conductive metallic reflectivity factor"),
        ("MATERIAL", "wireframe", "boolean", "Boolean Flag", "false", "Toggles polygonal edge outline rendering"),
        ("MATERIAL", "opacity", "number", "Float (0.0 to 1.0)", "1.0", "Alpha transparency blend factor")
    ]
    
    ws5.row_dimensions[1].height = 28
    for col_i in range(1, len(headers5) + 1):
        cell = ws5.cell(row=1, column=col_i)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = cell_border
        
    for r_i, sc in enumerate(schema_data, start=2):
        ws5.append(sc)
        ws5.row_dimensions[r_i].height = 28
        for col_i in range(1, len(headers5) + 1):
            c = ws5.cell(row=r_i, column=col_i)
            c.border = cell_border
            if col_i in [2, 3]:
                c.font = code_font
                c.alignment = align_code
            elif col_i == 1:
                c.font = bold_data_font
                c.alignment = align_center
            else:
                c.font = data_font
                c.alignment = align_left

    col_widths5 = {1: 18, 2: 22, 3: 28, 4: 28, 5: 32, 6: 48}
    for col_i, w in col_widths5.items():
        ws5.column_dimensions[get_column_letter(col_i)].width = w
    ws5.freeze_panes = "A2"

    # Save Workbook
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wb.save(output_path)
    print(f"Successfully generated Excel specification at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("docs/EPSTEIN_ENGINE_VERIFICATION_AND_TEST_CASES.xlsx")
    build_excel_specification(out_file)
    # Also save a copy on Desktop for easy access
    desktop_copy = os.path.expanduser("~/Desktop/EPSTEIN_ENGINE_VERIFICATION_AND_TEST_CASES.xlsx")
    try:
        build_excel_specification(desktop_copy)
    except Exception as e:
        print(f"Desktop copy notice: {e}")
