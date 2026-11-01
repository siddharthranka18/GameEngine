#pragma once
#include <string>
#include <map>

namespace Epstein {

// Single canonical location for all project configuration.
// startupSceneId lives ONLY here — not duplicated in Project.
struct ProjectConfig {
    std::string startupSceneId;           // empty = no startup scene configured
    std::string buildTarget   = "Windows";
    std::string engineVersion = "0.1.0";
    std::map<std::string, std::string> customSettings;

    bool operator==(const ProjectConfig& o) const {
        return startupSceneId == o.startupSceneId &&
               buildTarget    == o.buildTarget    &&
               engineVersion  == o.engineVersion  &&
               customSettings == o.customSettings;
    }
};

} // namespace Epstein
