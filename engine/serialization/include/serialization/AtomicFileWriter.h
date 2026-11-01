#pragma once
#include "core/Common.h"
#include <filesystem>
#include <string>

namespace fs = std::filesystem;

namespace Epstein {

// Windows-safe atomic file write.
// Writes to <target>.tmp, then renames to <target>.
// On Windows, if destination exists, uses MoveFileExW.
// Original file is never destroyed if the write fails.
Result<void> atomicWriteFile(const fs::path& target, const std::string& content);

} // namespace Epstein
