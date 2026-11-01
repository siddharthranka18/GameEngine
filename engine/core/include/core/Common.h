#pragma once
#include <string>
#include <stdexcept>

namespace Epstein {

enum class ErrorCode {
    Success = 0,
    InvalidName,
    InvalidPath,
    InvalidArgument,
    FileNotFound,
    IOError,
    ProjectAlreadyOpen,
    NoActiveProject,
    NoActiveScene,
    ProjectAlreadyExists,
    SceneNotFound,
    ObjectNotFound,
    DuplicateId,
    InvalidReference,
    AlreadyHasParent,
    CircularHierarchy,
    DeserializationFailed,
    MissingRequiredField,
    UnsupportedSchemaVersion
};

inline const char* errorCodeToString(ErrorCode code) {
    switch (code) {
        case ErrorCode::Success:                  return "Success";
        case ErrorCode::InvalidName:              return "InvalidName";
        case ErrorCode::InvalidPath:              return "InvalidPath";
        case ErrorCode::InvalidArgument:          return "InvalidArgument";
        case ErrorCode::FileNotFound:             return "FileNotFound";
        case ErrorCode::IOError:                  return "IOError";
        case ErrorCode::ProjectAlreadyOpen:       return "ProjectAlreadyOpen";
        case ErrorCode::NoActiveProject:          return "NoActiveProject";
        case ErrorCode::NoActiveScene:            return "NoActiveScene";
        case ErrorCode::ProjectAlreadyExists:     return "ProjectAlreadyExists";
        case ErrorCode::SceneNotFound:            return "SceneNotFound";
        case ErrorCode::ObjectNotFound:           return "ObjectNotFound";
        case ErrorCode::DuplicateId:              return "DuplicateId";
        case ErrorCode::InvalidReference:         return "InvalidReference";
        case ErrorCode::AlreadyHasParent:         return "AlreadyHasParent";
        case ErrorCode::CircularHierarchy:        return "CircularHierarchy";
        case ErrorCode::DeserializationFailed:    return "DeserializationFailed";
        case ErrorCode::MissingRequiredField:     return "MissingRequiredField";
        case ErrorCode::UnsupportedSchemaVersion: return "UnsupportedSchemaVersion";
        default: return "Unknown";
    }
}

struct EngineError {
    ErrorCode code;
    std::string message;

    EngineError(ErrorCode c, std::string msg = "")
        : code(c), message(std::move(msg)) {}
};

// Minimal Result<T,E> type (C++17 compatible)
template<typename T>
struct Result {
    bool success;
    T    value;
    EngineError error;

    static Result ok(T val) {
        Result r;
        r.success = true;
        r.value   = std::move(val);
        r.error   = EngineError(ErrorCode::Success);
        return r;
    }
    static Result fail(ErrorCode code, std::string msg = "") {
        Result r;
        r.success = false;
        r.error   = EngineError(code, std::move(msg));
        return r;
    }
    bool isOk()   const { return success; }
    bool isErr()  const { return !success; }

private:
    Result() : success(false), error(ErrorCode::Success) {}
};

// Specialisation for void
template<>
struct Result<void> {
    bool        success;
    EngineError error;

    static Result ok() {
        Result r;
        r.success = true;
        r.error   = EngineError(ErrorCode::Success);
        return r;
    }
    static Result fail(ErrorCode code, std::string msg = "") {
        Result r;
        r.success = false;
        r.error   = EngineError(code, std::move(msg));
        return r;
    }
    bool isOk()  const { return success; }
    bool isErr() const { return !success; }

private:
    Result() : success(false), error(ErrorCode::Success) {}
};

} // namespace Epstein
