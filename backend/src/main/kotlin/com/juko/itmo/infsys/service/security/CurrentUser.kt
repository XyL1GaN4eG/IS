package com.juko.itmo.infsys.service.security

data class CurrentUser(
    val username: String,
    val role: UserRole = UserRole.USER,
)

enum class UserRole {
    USER,
    ADMIN
}
