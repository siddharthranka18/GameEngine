#include "project/ProjectManager.h"
#include "core/Uuid.h"
#include <filesystem>

namespace fs = std::filesystem;

namespace Epstein {

ProjectManager::ProjectManager(IProjectSerializer& serializer)
    : m_serializer(serializer) {}

Result<void> ProjectManager::requireActiveProject() const {
    if (!m_project)
        return Result<void>::fail(ErrorCode::NoActiveProject,
                                  "No project is currently open");
    return Result<void>::ok();
}

// FR-01
Result<void> ProjectManager::createProject(const std::string& name,
                                            const fs::path&    rootPath) {
    if (m_project)
        return Result<void>::fail(ErrorCode::ProjectAlreadyOpen,
                                  "Close the current project before creating a new one");

    if (name.empty())
        return Result<void>::fail(ErrorCode::InvalidName, "Project name cannot be empty");

    std::error_code ec;
    if (fs::exists(rootPath, ec) && fs::is_regular_file(rootPath, ec))
        return Result<void>::fail(ErrorCode::InvalidPath,
                                  "rootPath points to a file, not a directory");

    fs::path projectFile = rootPath / "project.epstein";
    if (fs::exists(projectFile, ec))
        return Result<void>::fail(ErrorCode::ProjectAlreadyExists,
                                  "A project already exists at: " + rootPath.string());

    // Create directory structure
    fs::create_directories(rootPath / "scenes", ec);
    if (ec) return Result<void>::fail(ErrorCode::IOError,
                                      "Failed to create project directories: " + ec.message());
    fs::create_directories(rootPath / "assets", ec);

    std::string uuid = generateUuid();
    ProjectConfig cfg;
    m_project = std::make_unique<Project>(uuid, name, rootPath, cfg);

    auto saveRes = m_serializer.save(*m_project);
    if (saveRes.isErr()) {
        m_project.reset(); // rollback
        return saveRes;
    }

    return Result<void>::ok();
}

// FR-02
Result<void> ProjectManager::openProject(const fs::path& projectFilePath) {
    if (m_project)
        return Result<void>::fail(ErrorCode::ProjectAlreadyOpen,
                                  "Close the current project before opening another");

    auto loadRes = m_serializer.load(projectFilePath);
    if (loadRes.isErr())
        return Result<void>::fail(loadRes.error.code, loadRes.error.message);

    m_project = std::move(loadRes.value);
    return Result<void>::ok();
}

// FR-03
Result<void> ProjectManager::saveProject() {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;
    return m_serializer.save(*m_project);
}

// FR-04
Result<void> ProjectManager::closeProject() {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;
    m_project.reset();
    return Result<void>::ok();
}

// FR-05
Result<void> ProjectManager::setStartupScene(const std::string& sceneId) {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;

    if (!sceneId.empty() && !m_project->containsScene(sceneId))
        return Result<void>::fail(ErrorCode::InvalidReference,
                                  "sceneId not registered in project: " + sceneId);

    ProjectConfig cfg = m_project->getConfig();
    cfg.startupSceneId = sceneId;
    m_project->setConfig(cfg);
    return Result<void>::ok();
}

Result<void> ProjectManager::setBuildTarget(const std::string& target) {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;
    ProjectConfig cfg = m_project->getConfig();
    cfg.buildTarget = target;
    m_project->setConfig(cfg);
    return Result<void>::ok();
}

Result<void> ProjectManager::setCustomSetting(const std::string& key,
                                               const std::string& value) {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;
    ProjectConfig cfg = m_project->getConfig();
    cfg.customSettings[key] = value;
    m_project->setConfig(cfg);
    return Result<void>::ok();
}

Result<void> ProjectManager::registerScene(const std::string& sceneId) {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;
    if (m_project->containsScene(sceneId))
        return Result<void>::fail(ErrorCode::DuplicateId,
                                  "Scene already registered: " + sceneId);
    m_project->addSceneId(sceneId);
    return Result<void>::ok();
}

Result<void> ProjectManager::unregisterScene(const std::string& sceneId) {
    auto guard = requireActiveProject();
    if (guard.isErr()) return guard;
    if (!m_project->containsScene(sceneId))
        return Result<void>::fail(ErrorCode::SceneNotFound,
                                  "Scene not registered: " + sceneId);

    m_project->removeSceneId(sceneId);

    // Clear startupSceneId if it pointed to the deleted scene
    if (m_project->getConfig().startupSceneId == sceneId) {
        ProjectConfig cfg = m_project->getConfig();
        cfg.startupSceneId.clear();
        m_project->setConfig(cfg);
    }
    return Result<void>::ok();
}

} // namespace Epstein
