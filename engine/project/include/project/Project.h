#pragma once
#include "project/ProjectConfig.h"
#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>

namespace fs = std::filesystem;

namespace Epstein {

// Pure data model for an open project.
// All mutations go through ProjectManager — this class is a data bag.
class Project {
public:
    Project(std::string uuid,
            std::string name,
            fs::path    rootPath,
            ProjectConfig config = {})
        : m_uuid(std::move(uuid))
        , m_name(std::move(name))
        , m_rootPath(std::move(rootPath))
        , m_config(std::move(config))
    {}

    // ── Getters ──────────────────────────────────────────────────────────────
    const std::string&              getUuid()       const { return m_uuid; }
    const std::string&              getName()       const { return m_name; }
    const fs::path&                 getRootPath()   const { return m_rootPath; }
    fs::path                        getScenesPath() const { return m_rootPath / "scenes"; }
    fs::path                        getAssetsPath() const { return m_rootPath / "assets"; }
    fs::path                        getProjectFile()const { return m_rootPath / "project.epstein"; }
    const std::vector<std::string>& getSceneIds()   const { return m_sceneIds; }
    const ProjectConfig&            getConfig()     const { return m_config; }
    bool containsScene(const std::string& id) const {
        return std::find(m_sceneIds.begin(), m_sceneIds.end(), id) != m_sceneIds.end();
    }

    // ── Package-internal mutators (called only by ProjectManager) ─────────
    void addSceneId(const std::string& id)    { m_sceneIds.push_back(id); }
    void removeSceneId(const std::string& id) {
        m_sceneIds.erase(std::remove(m_sceneIds.begin(), m_sceneIds.end(), id),
                         m_sceneIds.end());
    }
    void setConfig(const ProjectConfig& cfg)  { m_config = cfg; }
    void setName(const std::string& name)     { m_name = name; }

private:
    std::string              m_uuid;
    std::string              m_name;
    fs::path                 m_rootPath;
    std::vector<std::string> m_sceneIds;
    ProjectConfig            m_config;
};

} // namespace Epstein
