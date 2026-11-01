#include "serialization/AtomicFileWriter.h"
#include <fstream>
#ifdef EPSTEIN_WINDOWS
#include <windows.h>
#endif

namespace Epstein {

Result<void> atomicWriteFile(const fs::path& target, const std::string& content) {
    fs::path tmp = fs::path(target).replace_extension(".epstein_tmp");
    if (target.extension() == ".scene") {
        tmp = fs::path(target).string() + ".tmp";
    } else {
        tmp = fs::path(target).string() + ".tmp";
    }

    // 1. Write to .tmp
    {
        std::ofstream out(tmp, std::ios::binary | std::ios::trunc);
        if (!out) {
            return Result<void>::fail(ErrorCode::IOError,
                "Failed to open temp file for writing: " + tmp.string());
        }
        out.write(content.c_str(), static_cast<std::streamsize>(content.size()));
        if (!out) {
            std::error_code ec;
            fs::remove(tmp, ec);
            return Result<void>::fail(ErrorCode::IOError, "Failed to write to temp file");
        }
    }

#ifdef EPSTEIN_WINDOWS
    // 2. Windows: MoveFileExW with MOVEFILE_REPLACE_EXISTING (atomic on NTFS)
    std::wstring wsrc = tmp.wstring();
    std::wstring wdst = target.wstring();
    if (!MoveFileExW(wsrc.c_str(), wdst.c_str(), MOVEFILE_REPLACE_EXISTING)) {
        DWORD err = GetLastError();
        std::error_code ec;
        fs::remove(tmp, ec);
        return Result<void>::fail(ErrorCode::IOError,
            "MoveFileExW failed with error: " + std::to_string(err));
    }
#else
    // 3. POSIX: rename is atomic when src/dst are on same filesystem
    std::error_code ec;
    fs::rename(tmp, target, ec);
    if (ec) {
        fs::remove(tmp, ec);
        return Result<void>::fail(ErrorCode::IOError,
            "rename failed: " + ec.message());
    }
#endif

    return Result<void>::ok();
}

} // namespace Epstein
