#pragma once
#include "core/Common.h"
#include "project/Project.h"
#include "serialization/ProjectSerializer.h"
#include <memory>
#include <filesystem>

namespace fs = std::filesystem;

namespace Epstein {

// Manages the lifecycle of a single active Project.
// Does NOT communicate with SceneManager — that coordination is done by EpsteinEngine.
class ProjectManager {
public:
    explicit ProjectManager(IProjectSerializer& serializer);

    // ── State queries ─────────────────────────────────────────────────────
    bool hasActiveProject() const noexcept { return m_project != nullptr; }

    // Returns nullptr if no project is open. Lifetime: valid until closeProject().
    const Project* getActiveProject() const noexcept { return m_project.get(); }
    Project*       getActiveProject()       noexcept { return m_project.get(); }

    // ── Lifecycle ─────────────────────────────────────────────────────────
    // FR-01
    Result<void> createProject(const std::string& name, const fs::path& rootPath);
    // FR-02
    Result<void> openProject(const fs::path& projectFilePath);
    // FR-03
    Result<void> saveProject();
    // FR-04  (EpsteinEngine must call SceneManager::unloadActive() BEFORE this)
    Result<void> closeProject();

    // ── Configuration (FR-05) ─────────────────────────────────────────────
    Result<void> setStartupScene(const std::string& sceneId);
    Result<void> setBuildTarget(const std::string& target);
    Result<void> setCustomSetting(const std::string& key, const std::string& value);

    // ── Scene registry (called by EpsteinEngine after SceneManager creates/deletes) ──
    Result<void> registerScene(const std::string& sceneId);
    Result<void> unregisterScene(const std::string& sceneId);

private:
    IProjectSerializer&       m_serializer;
    std::unique_ptr<Project>  m_project;

    Result<void> requireActiveProject() const;
};

} // namespace Epstein
