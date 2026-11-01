import React, { useEffect } from 'react';
import { Toolbar } from './components/layout/Toolbar';
import { SceneHierarchy } from './components/hierarchy/SceneHierarchy';
import { Viewport3D } from './components/viewport/Viewport3D';
import { Inspector } from './components/inspector/Inspector';
import { ConsolePanel } from './components/console/ConsolePanel';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { OpenProjectModal } from './components/modals/OpenProjectModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { useEngineStore } from './store/engineStore';

export const App: React.FC = () => {
  const {
    project,
    createProject,
    openProject,
    refreshProjectList,
    projectList,
    setTransformMode,
    undo,
    redo,
    saveProjectAndScene,
    selectedId,
    removeGameObject,
  } = useEngineStore();

  // On first mount: auto-load recent project or create starter project
  useEffect(() => {
    const init = async () => {
      await refreshProjectList();
      const currentList = useEngineStore.getState().projectList;
      if (currentList.length > 0) {
        await openProject(currentList[0].id);
      } else {
        await createProject('Epstein Demo Project');
      }
    };
    init();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'w' || e.key === 'W') {
        setTransformMode('translate');
      } else if (e.key === 'e' || e.key === 'E') {
        setTransformMode('rotate');
      } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('scale');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveProjectAndScene();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          removeGameObject(selectedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTransformMode, undo, redo, saveProjectAndScene, selectedId, removeGameObject]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-editor-bg text-editor-text">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Workspace (Hierarchy + Viewport + Inspector) */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left: Scene Hierarchy */}
        <SceneHierarchy />

        {/* Center: 3D Viewport */}
        <Viewport3D />

        {/* Right: Inspector */}
        <Inspector />
      </main>

      {/* Bottom: Console Panel */}
      <ConsolePanel />

      {/* Modals */}
      <NewProjectModal />
      <OpenProjectModal />
      <SettingsModal />
    </div>
  );
};

export default App;
