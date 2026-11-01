add_library(epstein_engine STATIC
    core/src/EpsteinEngine.cpp
    math/src/Vector3.cpp
    math/src/Matrix4x4.cpp
    project/src/ProjectConfig.cpp
    project/src/Project.cpp
    project/src/ProjectManager.cpp
    scene/src/Transform.cpp
    scene/src/GameObject.cpp
    scene/src/Scene.cpp
    scene/src/SceneManager.cpp
    serialization/src/AtomicFileWriter.cpp
    serialization/src/ProjectSerializer.cpp
    serialization/src/SceneSerializer.cpp
)

target_include_directories(epstein_engine PUBLIC
    core/include
    math/include
    project/include
    scene/include
    serialization/include
)

target_link_libraries(epstein_engine PUBLIC nlohmann_json::nlohmann_json)

if(WIN32)
    target_compile_definitions(epstein_engine PUBLIC EPSTEIN_WINDOWS)
endif()
