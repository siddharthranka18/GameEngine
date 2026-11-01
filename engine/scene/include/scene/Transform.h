#pragma once
#include "math/Vector3.h"
#include "math/Matrix4x4.h"

namespace Epstein {

// Transform conventions:
//   Storage:     Row-major Matrix4x4 (m[row][col])
//   Angles:      Radians, ZYX Euler (pitch=X, yaw=Y, roll=Z)
//   Local order: TRS  => Local = T * R * S
//   World chain: World = Parent.World * Local
//   Zero scale:  Accepted — produces degenerate matrix (no crash)
//   Neg scale:   Accepted — produces mirror effect
struct Transform {
    Vector3 position = Vector3::zero();
    Vector3 rotation = Vector3::zero(); // radians, ZYX Euler
    Vector3 scale    = Vector3::one();

    void setPosition(const Vector3& p) { position = p; }
    void setRotation(const Vector3& r) { rotation = r; }
    void setScale   (const Vector3& s) { scale    = s; }

    void translate(const Vector3& offset) { position = position + offset; }
    void rotate   (const Vector3& delta)  { rotation = rotation + delta; }

    // Local matrix = T * R * S
    Matrix4x4 toLocalMatrix() const {
        return Matrix4x4::trs(position, rotation, scale);
    }

    // World matrix = parentWorld * Local
    static Matrix4x4 computeWorldMatrix(const Transform& local,
                                         const Matrix4x4& parentWorld) {
        return Matrix4x4::multiply(parentWorld, local.toLocalMatrix());
    }

    bool operator==(const Transform& o) const {
        return position == o.position &&
               rotation == o.rotation &&
               scale    == o.scale;
    }
};

} // namespace Epstein
