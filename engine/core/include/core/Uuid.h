#pragma once
#include <string>
#include <random>
#include <sstream>
#include <iomanip>

namespace Epstein {

// Generates a UUID v4 string (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
inline std::string generateUuid() {
    static std::random_device rd;
    static std::mt19937_64 gen(rd());
    static std::uniform_int_distribution<uint64_t> dis;

    uint64_t hi = dis(gen);
    uint64_t lo = dis(gen);

    // Set version 4 (bits 12-15 of hi = 0100)
    hi = (hi & 0xFFFFFFFFFFFF0FFFULL) | 0x0000000000004000ULL;
    // Set variant bits (bits 62-63 of lo = 10)
    lo = (lo & 0x3FFFFFFFFFFFFFFFULL) | 0x8000000000000000ULL;

    std::ostringstream ss;
    ss << std::hex << std::setfill('0');
    ss << std::setw(8) << ((hi >> 32) & 0xFFFFFFFF) << '-';
    ss << std::setw(4) << ((hi >> 16) & 0xFFFF)     << '-';
    ss << std::setw(4) << (hi & 0xFFFF)              << '-';
    ss << std::setw(4) << ((lo >> 48) & 0xFFFF)      << '-';
    ss << std::setw(12) << (lo & 0xFFFFFFFFFFFFULL);
    return ss.str();
}

inline bool isValidUuid(const std::string& s) {
    if (s.size() != 36) return false;
    for (int i = 0; i < 36; ++i) {
        char c = s[i];
        if (i == 8 || i == 13 || i == 18 || i == 23) {
            if (c != '-') return false;
        } else {
            if (!isxdigit(static_cast<unsigned char>(c))) return false;
        }
    }
    return true;
}

} // namespace Epstein
