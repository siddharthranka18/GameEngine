#pragma once
#include <cmath>

namespace Epstein {

struct Vector3 {
    float x = 0.0f;
    float y = 0.0f;
    float z = 0.0f;

    Vector3() = default;
    Vector3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}

    Vector3 operator+(const Vector3& o) const { return {x+o.x, y+o.y, z+o.z}; }
    Vector3 operator-(const Vector3& o) const { return {x-o.x, y-o.y, z-o.z}; }
    Vector3 operator*(float s)          const { return {x*s, y*s, z*s}; }

    bool operator==(const Vector3& o) const {
        return x == o.x && y == o.y && z == o.z;
    }
    bool operator!=(const Vector3& o) const { return !(*this == o); }

    // Approximate equality with epsilon
    bool approxEqual(const Vector3& o, float eps = 1e-5f) const {
        return std::fabs(x - o.x) < eps &&
               std::fabs(y - o.y) < eps &&
               std::fabs(z - o.z) < eps;
    }

    float length() const { return std::sqrt(x*x + y*y + z*z); }

    static Vector3 zero()  { return {0,0,0}; }
    static Vector3 one()   { return {1,1,1}; }
};

} // namespace Epstein
