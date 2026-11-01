#pragma once
#include "math/Vector3.h"
#include <cstring>
#include <cmath>

namespace Epstein {

// Row-major 4x4 matrix.  m[row][col].
// World transform chain: World = Parent.World * Local
// TRS local order:       Local = T * R * S  (scale first, then rotate, then translate)
struct Matrix4x4 {
    float m[4][4];

    Matrix4x4() { std::memset(m, 0, sizeof(m)); }

    static Matrix4x4 identity() {
        Matrix4x4 r;
        r.m[0][0] = r.m[1][1] = r.m[2][2] = r.m[3][3] = 1.0f;
        return r;
    }

    static Matrix4x4 translation(const Vector3& t) {
        Matrix4x4 r = identity();
        r.m[0][3] = t.x;
        r.m[1][3] = t.y;
        r.m[2][3] = t.z;
        return r;
    }

    // ZYX Euler rotation (radians). Applied as Rz * Ry * Rx (intrinsic ZYX = extrinsic XYZ).
    static Matrix4x4 rotationZYX(const Vector3& euler) {
        float cx = std::cos(euler.x), sx = std::sin(euler.x);
        float cy = std::cos(euler.y), sy = std::sin(euler.y);
        float cz = std::cos(euler.z), sz = std::sin(euler.z);

        Matrix4x4 r = identity();
        r.m[0][0] =  cy*cz;
        r.m[0][1] = -cy*sz;
        r.m[0][2] =  sy;
        r.m[1][0] =  sx*sy*cz + cx*sz;
        r.m[1][1] = -sx*sy*sz + cx*cz;
        r.m[1][2] = -sx*cy;
        r.m[2][0] = -cx*sy*cz + sx*sz;
        r.m[2][1] =  cx*sy*sz + sx*cz;
        r.m[2][2] =  cx*cy;
        return r;
    }

    static Matrix4x4 scale(const Vector3& s) {
        Matrix4x4 r = identity();
        r.m[0][0] = s.x;
        r.m[1][1] = s.y;
        r.m[2][2] = s.z;
        return r;
    }

    // TRS = T * R * S
    static Matrix4x4 trs(const Vector3& t, const Vector3& euler, const Vector3& s) {
        return multiply(multiply(translation(t), rotationZYX(euler)), scale(s));
    }

    // Row-major matrix multiplication: result = a * b
    static Matrix4x4 multiply(const Matrix4x4& a, const Matrix4x4& b) {
        Matrix4x4 r;
        for (int i = 0; i < 4; ++i)
            for (int j = 0; j < 4; ++j) {
                float sum = 0.0f;
                for (int k = 0; k < 4; ++k) sum += a.m[i][k] * b.m[k][j];
                r.m[i][j] = sum;
            }
        return r;
    }

    Matrix4x4 operator*(const Matrix4x4& o) const { return multiply(*this, o); }

    // Transform a point (w=1)
    Vector3 transformPoint(const Vector3& p) const {
        float x = m[0][0]*p.x + m[0][1]*p.y + m[0][2]*p.z + m[0][3];
        float y = m[1][0]*p.x + m[1][1]*p.y + m[1][2]*p.z + m[1][3];
        float z = m[2][0]*p.x + m[2][1]*p.y + m[2][2]*p.z + m[2][3];
        return {x, y, z};
    }
};

} // namespace Epstein
