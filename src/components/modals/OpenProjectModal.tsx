import React, { useEffect, useRef } from 'react';
import { FolderOpen, X, Trash2, Calendar, HardDrive, Upload } from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';
import { StorageService } from '../../services/storage';

export const OpenProjectModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    openProject,
    projectList,
    refreshProjectList,
    importProjectPackage,
    isProjectLoading,
  } = useEngineStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'openProject') {
      refreshProjectList();
    }
  }, [activeModal]);

  if (activeModal !== 'openProject') return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project from IndexedDB?')) {
      await StorageService.deleteProject(id);
      await refreshProjectList();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        await importProjectPackage(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-editor-panel border border-editor-panelBorder rounded-lg shadow-2xl w-full max-w-lg overflow-hidden text-xs flex flex-col max-h-[80vh]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />

        {/* Header */}
        <div className="p-3 border-b border-editor-panelBorder bg-editor-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-editor-warning" />
            <span className="font-semibold text-white uppercase tracking-wider text-xs">Open Project</span>
          </div>
          <button onClick={closeModal} className="text-editor-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of projects */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {projectList.length === 0 ? (
            <div className="py-8 text-center text-editor-textMuted space-y-2">
              <HardDrive className="w-8 h-8 mx-auto opacity-30" />
              <p>No projects saved in browser IndexedDB.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-editor-bg border border-editor-panelBorder text-white hover:border-editor-accent"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Project File</span>
              </button>
            </div>
          ) : (
            projectList.map((p) => (
              <div
                key={p.id}
                onClick={async () => {
                  const success = await openProject(p.id);
                  if (success) closeModal();
                }}
                className="flex items-center justify-between p-3 rounded bg-editor-bg border border-editor-panelBorder hover:border-editor-accent cursor-pointer group transition"
              >
                <div>
                  <div className="font-semibold text-white text-sm group-hover:text-editor-accent transition">
                    {p.name}
                  </div>
                  <div className="flex items-center space-x-3 mt-1 text-[11px] text-editor-textMuted">
                    <span>{p.sceneIds.length} scene(s)</span>
                    <span>&bull;</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    title="Delete Project"
                    className="p-1.5 rounded hover:bg-editor-panel text-editor-textMuted hover:text-editor-danger transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-editor-panelBorder bg-editor-header flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-editor-bg border border-editor-panelBorder text-editor-text hover:text-white hover:border-editor-accent transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import From File</span>
          </button>

          <button
            type="button"
            onClick={closeModal}
            className="px-3 py-1.5 rounded text-editor-textMuted hover:text-white hover:bg-editor-hoverItem"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
