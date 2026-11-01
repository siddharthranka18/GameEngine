#pragma once
#include "core/Common.h"
#include "project/Project.h"
#include <memory>
#include <filesystem>

namespace fs = std::filesystem;

namespace Epstein {

// Interface for project serialization (enables mocking in tests).
class IProjectSerializer {
public:
    virtual ~IProjectSerializer() = default;
    virtual Result<void>                   save(const Project& proj) = 0;
    virtual Result<std::unique_ptr<Project>> load(const fs::path& path) = 0;
};

// Production JSON implementation using nlohmann/json.
class ProjectSerializer : public IProjectSerializer {
public:
    static const int SCHEMA_VERSION = 1;

    Result<void>                     save(const Project& proj) override;
    Result<std::unique_ptr<Project>> load(const fs::path& path) override;
};

} // namespace Epstein
