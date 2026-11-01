#include "serialization/ProjectSerializer.h"
#include "serialization/AtomicFileWriter.h"
#include "core/Uuid.h"
#include <nlohmann/json.hpp>
#include <fstream>
#include <sstream>

using json = nlohmann::json;

namespace Epstein {

Result<void> ProjectSerializer::save(const Project& proj) {
    json j;
    j["schemaVersion"]  = SCHEMA_VERSION;
    j["uuid"]           = proj.getUuid();
    j["name"]           = proj.getName();
    j["engineVersion"]  = proj.getConfig().engineVersion;
    j["sceneIds"]       = proj.getSceneIds();

    json cfg;
    cfg["startupSceneId"] = proj.getConfig().startupSceneId;
    cfg["buildTarget"]    = proj.getConfig().buildTarget;
    cfg["engineVersion"]  = proj.getConfig().engineVersion;
    cfg["customSettings"] = proj.getConfig().customSettings;
    j["config"] = cfg;

    std::string content = j.dump(2);
    return atomicWriteFile(proj.getProjectFile(), content);
}

Result<std::unique_ptr<Project>> ProjectSerializer::load(const fs::path& path) {
    if (!fs::exists(path)) {
        return Result<std::unique_ptr<Project>>::fail(
            ErrorCode::FileNotFound, "Project file not found: " + path.string());
    }

    std::ifstream in(path);
    if (!in) {
        return Result<std::unique_ptr<Project>>::fail(
            ErrorCode::IOError, "Cannot open project file: " + path.string());
    }

    json j;
    try {
        in >> j;
    } catch (const json::exception& e) {
        return Result<std::unique_ptr<Project>>::fail(
            ErrorCode::DeserializationFailed, std::string("JSON parse error: ") + e.what());
    }

    // Schema version check
    if (!j.contains("schemaVersion") || !j["schemaVersion"].is_number_integer()) {
        return Result<std::unique_ptr<Project>>::fail(
            ErrorCode::MissingRequiredField, "Missing schemaVersion");
    }
    int sv = j["schemaVersion"].get<int>();
    if (sv != SCHEMA_VERSION) {
        return Result<std::unique_ptr<Project>>::fail(
            ErrorCode::UnsupportedSchemaVersion,
            "Unsupported schema version: " + std::to_string(sv));
    }

    // Required fields
    for (const auto& field : {"uuid", "name"}) {
        if (!j.contains(field) || !j[field].is_string()) {
            return Result<std::unique_ptr<Project>>::fail(
                ErrorCode::MissingRequiredField,
                std::string("Missing required field: ") + field);
        }
    }

    std::string uuid = j["uuid"].get<std::string>();
    std::string name = j["name"].get<std::string>();
    fs::path    root = path.parent_path();

    ProjectConfig cfg;
    if (j.contains("config") && j["config"].is_object()) {
        const auto& c = j["config"];
        if (c.contains("startupSceneId") && c["startupSceneId"].is_string())
            cfg.startupSceneId = c["startupSceneId"].get<std::string>();
        if (c.contains("buildTarget") && c["buildTarget"].is_string())
            cfg.buildTarget = c["buildTarget"].get<std::string>();
        if (c.contains("engineVersion") && c["engineVersion"].is_string())
            cfg.engineVersion = c["engineVersion"].get<std::string>();
        if (c.contains("customSettings") && c["customSettings"].is_object()) {
            for (auto& [k, v] : c["customSettings"].items()) {
                if (v.is_string()) cfg.customSettings[k] = v.get<std::string>();
            }
        }
    }

    auto proj = std::make_unique<Project>(uuid, name, root, cfg);

    if (j.contains("sceneIds") && j["sceneIds"].is_array()) {
        for (const auto& sid : j["sceneIds"]) {
            if (sid.is_string()) proj->addSceneId(sid.get<std::string>());
        }
    }

    // Validate startupSceneId refers to a known scene (if set)
    if (!cfg.startupSceneId.empty() && !proj->containsScene(cfg.startupSceneId)) {
        return Result<std::unique_ptr<Project>>::fail(
            ErrorCode::InvalidReference,
            "startupSceneId refers to unknown scene: " + cfg.startupSceneId);
    }

    return Result<std::unique_ptr<Project>>::ok(std::move(proj));
}

} // namespace Epstein
